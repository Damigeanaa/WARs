import express from 'express'
import { z } from 'zod'
import { dbRun, dbGet, dbAll } from '../database/database.js'
import { upload, processAndSaveImage, deleteProfilePicture, generateProfilePictureUrl } from '../services/imageService.js'
import { logCreate, logUpdate, logDelete } from '../middleware/auditLogger.js'

const router = express.Router()

// Function to generate unique driver ID
async function generateUniqueDriverId(): Promise<string> {
  let driverId: string
  let attempts = 0
  const maxAttempts = 10
  
  do {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    driverId = `DRV-${year}-${randomNum}`
    
    // Check if this ID already exists
    const existing = await dbGet('SELECT id FROM drivers WHERE driver_id = ?', [driverId])
    if (!existing) {
      break
    }
    
    attempts++
  } while (attempts < maxAttempts)
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique driver ID')
  }
  
  return driverId
}

// Validation schemas
const driverSchema = z.object({
  driver_id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required'),
  license_number: z.string().min(1, 'License number is required'),
  status: z.enum(['Active', 'Inactive', 'On Holiday']).optional(),
  join_date: z.string().min(1, 'Join date is required'),
  profile_picture: z.string().url('Invalid profile picture URL').optional().or(z.literal('')),
  current_address: z.string().optional(),
  employment_type: z.enum(['Fulltime', 'Minijob']).optional(),
  annual_vacation_days: z.number().min(0).max(365).optional()
})

// GET /api/drivers - Get all drivers
router.get('/', async (req, res) => {
  try {
    const drivers = await dbAll(`
      SELECT 
        d.*,
        COALESCE(SUM(
          CASE 
            WHEN h.status = 'Approved' 
            THEN julianday(h.end_date) - julianday(h.start_date) + 1 
            ELSE 0 
          END
        ), 0) as used_vacation_days
      FROM drivers d
      LEFT JOIN holidays h ON d.id = h.driver_id
      GROUP BY d.id
      ORDER BY d.name
    `)
    res.json(drivers)
  } catch (error) {
    console.error('Error fetching drivers:', error)
    res.status(500).json({ error: 'Failed to fetch drivers' })
  }
})

// GET /api/drivers/:id - Get driver by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const driver = await dbGet(`
      SELECT 
        d.*,
        COALESCE(SUM(
          CASE 
            WHEN h.status = 'Approved' 
            THEN julianday(h.end_date) - julianday(h.start_date) + 1 
            ELSE 0 
          END
        ), 0) as used_vacation_days
      FROM drivers d
      LEFT JOIN holidays h ON d.id = h.driver_id
      WHERE d.id = ?
      GROUP BY d.id
    `, [id])

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    res.json(driver)
  } catch (error) {
    console.error('Error fetching driver:', error)
    res.status(500).json({ error: 'Failed to fetch driver' })
  }
})

// GET /api/drivers/by-driver-id/:driverId - Get driver by driver_id (alphanumeric)
router.get('/by-driver-id/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params
    const driver = await dbGet(`
      SELECT 
        d.*,
        COALESCE(SUM(
          CASE 
            WHEN h.status = 'Approved' 
            THEN julianday(h.end_date) - julianday(h.start_date) + 1 
            ELSE 0 
          END
        ), 0) as used_vacation_days
      FROM drivers d
      LEFT JOIN holidays h ON d.id = h.driver_id
      WHERE d.driver_id = ?
      GROUP BY d.id
    `, [driverId])

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    res.json(driver)
  } catch (error) {
    console.error('Error fetching driver by driver_id:', error)
    res.status(500).json({ error: 'Failed to fetch driver' })
  }
})

// POST /api/drivers - Create new driver
router.post('/', async (req, res) => {
  try {
    console.log('Creating driver with data:', req.body)
    const validatedData = driverSchema.parse(req.body)
    console.log('Validation passed:', validatedData)
    
    // Use provided driver_id or generate unique driver ID
    let driverId = validatedData.driver_id
    if (!driverId) {
      driverId = await generateUniqueDriverId()
      console.log('Generated driver ID:', driverId)
    } else {
      console.log('Using provided driver ID:', driverId)
      // Check if provided driver_id already exists
      const existing = await dbGet('SELECT id FROM drivers WHERE driver_id = ?', [driverId])
      if (existing) {
        return res.status(400).json({ error: 'Driver ID already exists' })
      }
    }
    
    const result = await dbRun(`
      INSERT INTO drivers (driver_id, name, email, phone, license_number, status, join_date, profile_picture, current_address, employment_type, annual_vacation_days, used_vacation_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      driverId,
      validatedData.name,
      validatedData.email,
      validatedData.phone,
      validatedData.license_number,
      validatedData.status || 'Active',
      validatedData.join_date,
      validatedData.profile_picture || null,
      validatedData.current_address || null,
      validatedData.employment_type || 'Fulltime',
      validatedData.annual_vacation_days || (validatedData.employment_type === 'Minijob' ? 15 : 25),
      0 // initial used_vacation_days
    ])
    console.log('Database insert result:', result)

    // Get the inserted driver
    const newDriver = await dbGet(`
      SELECT * FROM drivers 
      WHERE driver_id = ?
    `, [driverId])
    console.log('Retrieved new driver:', newDriver)
    
    // Log audit entry for driver creation
    await logCreate(req, 'drivers', newDriver.id, newDriver)
    
    res.status(201).json(newDriver)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Error creating driver:', error)
    res.status(500).json({ error: 'Failed to create driver' })
  }
})

// PUT /api/drivers/:id - Update driver
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get original driver data for audit log
    const originalDriver = await dbGet('SELECT * FROM drivers WHERE id = ?', [id])
    if (!originalDriver) {
      return res.status(404).json({ error: 'Driver not found' })
    }
    
    const validatedData = driverSchema.partial().parse(req.body)

    const updateFields: string[] = []
    const updateValues: any[] = []

    Object.entries(validatedData).forEach(([key, value]) => {
      updateFields.push(`${key} = ?`)
      updateValues.push(value)
    })

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    updateValues.push(id)

    await dbRun(`
      UPDATE drivers 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, updateValues)

    const updatedDriver = await dbGet('SELECT * FROM drivers WHERE id = ?', [id])
    
    // Log audit entry for driver update
    await logUpdate(req, 'drivers', parseInt(id), originalDriver, updatedDriver)
    
    res.json(updatedDriver)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Error updating driver:', error)
    res.status(500).json({ error: 'Failed to update driver' })
  }
})

// DELETE /api/drivers/:id - Delete driver
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if driver exists
    const driver = await dbGet('SELECT * FROM drivers WHERE id = ?', [id])
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    // Delete profile picture if exists
    if (driver.profile_picture) {
      await deleteProfilePicture(driver.profile_picture)
    }

    // Delete related records first
    await dbRun('DELETE FROM warnings WHERE driver_id = ?', [id])
    await dbRun('DELETE FROM holidays WHERE driver_id = ?', [id])
    
    // Log audit entry for driver deletion (before deletion)
    await logDelete(req, 'drivers', parseInt(id), driver)
    
    // Delete driver
    await dbRun('DELETE FROM drivers WHERE id = ?', [id])
    
    res.json({ message: 'Driver deleted successfully' })
  } catch (error) {
    console.error('Error deleting driver:', error)
    res.status(500).json({ error: 'Failed to delete driver' })
  }
})

// POST /api/drivers/:id/profile-picture - Upload profile picture
router.post('/:id/profile-picture', upload.single('profile_picture'), async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if driver exists
    const driver = await dbGet('SELECT * FROM drivers WHERE id = ?', [id])
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }

    // Delete old profile picture if exists
    if (driver.profile_picture) {
      await deleteProfilePicture(driver.profile_picture)
    }

    // Process and save new image
    const imagePath = await processAndSaveImage(
      req.file.buffer,
      `driver_${id}`,
      { width: 200, height: 200, quality: 85 }
    )

    // Update driver with new profile picture path
    await dbRun(
      'UPDATE drivers SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [imagePath, id]
    )

    // Get updated driver
    const updatedDriver = await dbGet('SELECT * FROM drivers WHERE id = ?', [id])

    res.json({
      message: 'Profile picture updated successfully',
      profile_picture: generateProfilePictureUrl(imagePath),
      driver: updatedDriver
    })
  } catch (error) {
    console.error('Error uploading profile picture:', error)
    if (error instanceof Error && error.message.includes('Invalid file type')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to upload profile picture' })
  }
})

// DELETE /api/drivers/:id/profile-picture - Remove profile picture
router.delete('/:id/profile-picture', async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if driver exists
    const driver = await dbGet('SELECT * FROM drivers WHERE id = ?', [id])
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    // Delete profile picture if exists
    if (driver.profile_picture) {
      await deleteProfilePicture(driver.profile_picture)
    }

    // Update driver to remove profile picture
    await dbRun(
      'UPDATE drivers SET profile_picture = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    )

    res.json({ message: 'Profile picture removed successfully' })
  } catch (error) {
    console.error('Error removing profile picture:', error)
    res.status(500).json({ error: 'Failed to remove profile picture' })
  }
})

export { router as driversRouter }
