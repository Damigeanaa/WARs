import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { z } from 'zod'
import { dbRun, dbGet, dbAll } from '../database/database.js'
import { logCreate, logUpdate, logDelete } from '../middleware/auditLogger.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'warnings')
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    cb(null, `warning_${timestamp}_${originalName}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

// Validation schemas
const warningSchema = z.object({
  driver_id: z.number().positive(),
  category_id: z.number().positive().optional().nullable(),
  type: z.string().min(1, 'Warning type is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.enum(['Active', 'Under Review', 'Resolved']).optional(),
  location: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  expiration_date: z.string().optional()
})

// GET /api/warnings - Get all warnings
router.get('/', async (req, res) => {
  try {
    const warnings = await dbAll(`
      SELECT 
        w.*,
        d.name as driver_name,
        d.email as driver_email,
        wc.name as category_name,
        wc.color as category_color,
        wc.icon as category_icon
      FROM warnings w
      JOIN drivers d ON w.driver_id = d.id
      LEFT JOIN warning_categories wc ON w.category_id = wc.id
      ORDER BY w.date DESC, w.created_at DESC
    `)
    res.json(warnings)
  } catch (error) {
    console.error('Error fetching warnings:', error)
    res.status(500).json({ error: 'Failed to fetch warnings' })
  }
})

// GET /api/warnings/driver/:driverId - Get warnings for specific driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params
    const warnings = await dbAll(`
      SELECT 
        w.*, 
        d.name as driver_name,
        wc.name as category_name,
        wc.color as category_color,
        wc.icon as category_icon
      FROM warnings w
      JOIN drivers d ON w.driver_id = d.id
      LEFT JOIN warning_categories wc ON w.category_id = wc.id
      WHERE w.driver_id = ?
      ORDER BY w.date DESC
    `, [driverId])
    res.json(warnings)
  } catch (error) {
    console.error('Error fetching driver warnings:', error)
    res.status(500).json({ error: 'Failed to fetch driver warnings' })
  }
})

// POST /api/warnings - Create new warning with optional PDF attachment
router.post('/', upload.single('pdf_attachment'), async (req, res) => {
  try {
    console.log('Received POST request to /api/warnings')
    console.log('Request body:', req.body)
    console.log('Request file:', req.file)

    // Parse driver_id and category_id to numbers
    const driver_id = typeof req.body.driver_id === 'string' ? 
      parseInt(req.body.driver_id) : req.body.driver_id;
    const category_id = req.body.category_id && req.body.category_id !== '' ? 
      (typeof req.body.category_id === 'string' ? parseInt(req.body.category_id) : req.body.category_id) : null;

    const validatedData = warningSchema.parse({
      ...req.body,
      driver_id: driver_id,
      category_id: category_id
    })
    
    console.log('Validated data:', validatedData)
    
    const pdfPath = req.file ? req.file.filename : null
    
    console.log('About to execute database insert...')
    
    await dbRun(`
      INSERT INTO warnings (driver_id, category_id, type, description, severity, status, location, date, expiration_date, document_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      validatedData.driver_id,
      validatedData.category_id || null,
      validatedData.type,
      validatedData.description,
      validatedData.severity || 'Medium',
      validatedData.status || 'Active',
      validatedData.location || null,
      validatedData.date,
      validatedData.expiration_date || null,
      pdfPath
    ])

    // Get the last inserted row ID from sqlite
    const lastIdResult = await dbGet('SELECT last_insert_rowid() as id')
    const insertedId = lastIdResult?.id
    
    console.log('Last ID result:', lastIdResult)
    console.log('Inserted ID:', insertedId)

    if (!insertedId) {
      throw new Error('Failed to create warning - no ID returned')
    }

    // Get the inserted warning with driver and category information
    const newWarning = await dbGet(`
      SELECT 
        w.*, 
        d.name as driver_name, 
        d.email as driver_email,
        wc.name as category_name,
        wc.color as category_color,
        wc.icon as category_icon
      FROM warnings w
      JOIN drivers d ON w.driver_id = d.id
      LEFT JOIN warning_categories wc ON w.category_id = wc.id
      WHERE w.id = ?
    `, [insertedId])
    
    console.log('Retrieved warning:', newWarning)

    if (!newWarning) {
      throw new Error('Failed to retrieve created warning')
    }

    // Log the audit trail for warning creation
    await logCreate(req, 'warnings', insertedId, newWarning)

    res.status(201).json(newWarning)
  } catch (error) {
    // Clean up uploaded file if database operation failed
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err)
      })
    }
    
    console.error('Error in warning creation:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File upload error', details: error.message })
    }
    
    res.status(500).json({ 
      error: 'Failed to create warning', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// PUT /api/warnings/:id - Update warning
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get the existing warning before updating
    const existingWarning = await dbGet(`
      SELECT w.*, d.name as driver_name
      FROM warnings w
      JOIN drivers d ON w.driver_id = d.id
      WHERE w.id = ?
    `, [id])
    
    if (!existingWarning) {
      return res.status(404).json({ error: 'Warning not found' })
    }
    
    const validatedData = warningSchema.partial().parse(req.body)

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
      UPDATE warnings 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, updateValues)

    const updatedWarning = await dbGet(`
      SELECT w.*, d.name as driver_name
      FROM warnings w
      JOIN drivers d ON w.driver_id = d.id
      WHERE w.id = ?
    `, [id])
    
    // Log the audit trail for warning update
    await logUpdate(req, 'warnings', parseInt(id), existingWarning, updatedWarning)
    
    res.json(updatedWarning)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Error updating warning:', error)
    res.status(500).json({ error: 'Failed to update warning' })
  }
})

// DELETE /api/warnings/:id - Delete warning
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get warning details including PDF attachment
    const warning = await dbGet('SELECT * FROM warnings WHERE id = ?', [id])
    if (!warning) {
      return res.status(404).json({ error: 'Warning not found' })
    }

    // Delete PDF file if it exists
    if (warning.pdf_attachment) {
      const filePath = path.join(process.cwd(), 'uploads', 'warnings', warning.pdf_attachment)
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log('Deleted PDF file:', warning.pdf_attachment)
        }
      } catch (error) {
        console.error('Error deleting PDF file:', error)
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete warning from database
    await dbRun('DELETE FROM warnings WHERE id = ?', [id])
    
    // Log the audit trail for warning deletion
    await logDelete(req, 'warnings', parseInt(id), warning)
    
    res.json({ message: 'Warning deleted successfully' })
  } catch (error) {
    console.error('Error deleting warning:', error)
    res.status(500).json({ error: 'Failed to delete warning' })
  }
})

// GET /api/warnings/analytics - Get warning analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const analytics = await dbAll(`
      SELECT 
        severity,
        COUNT(*) as count,
        status
      FROM warnings 
      GROUP BY severity, status
      ORDER BY severity, status
    `)
    
    const typeAnalytics = await dbAll(`
      SELECT 
        type,
        COUNT(*) as count,
        AVG(CASE WHEN severity = 'High' THEN 3 WHEN severity = 'Medium' THEN 2 ELSE 1 END) as avg_severity
      FROM warnings 
      GROUP BY type
      ORDER BY count DESC
    `)

    res.json({
      severity_breakdown: analytics,
      type_analytics: typeAnalytics
    })
  } catch (error) {
    console.error('Error fetching warning analytics:', error)
    res.status(500).json({ error: 'Failed to fetch warning analytics' })
  }
})

// GET /api/warnings/:id/pdf - Download PDF attachment
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params
    
    const warning = await dbGet(`
      SELECT pdf_attachment FROM warnings WHERE id = ?
    `, [id])

    if (!warning || !warning.pdf_attachment) {
      return res.status(404).json({ error: 'PDF attachment not found' })
    }

    const filePath = path.join(process.cwd(), 'uploads', 'warnings', warning.pdf_attachment)
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF file not found on server' })
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${warning.pdf_attachment}"`)
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error('Error serving PDF:', error)
    res.status(500).json({ error: 'Failed to serve PDF file' })
  }
})

export { router as warningsRouter }
