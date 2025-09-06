import express from 'express'
import multer from 'multer'
import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { dbRun, dbGet, dbAll } from '../database/database.js'

const router = express.Router()

// Types for import results
interface ImportError {
  row: number
  name: string
  error: string
}

interface ImportResults {
  total: number
  imported: number
  updated: number
  errors: ImportError[]
}

// Configure multer for CSV file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'imports')
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    cb(null, `import_${timestamp}_${file.originalname}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'))
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// CSV driver schema validation
const csvDriverSchema = z.object({
  'Delivery Associate Name': z.string().min(1, 'Name is required'),
  'Delivery Associate ID': z.string().min(1, 'Driver ID is required')
})

// POST /import/drivers - Import drivers from CSV (matches frontend expectation)
router.post('/drivers', upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' })
    }

    const filePath = req.file.path
    const results: ImportResults = {
      total: 0,
      imported: 0,
      updated: 0,
      errors: []
    }

    // Create a promise to handle the CSV parsing
    const processCSV = () => {
      return new Promise<void>((resolve, reject) => {
        const drivers: any[] = []
        
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            results.total++
            
            // Extract data from CSV row
            const name = row['Delivery Associate Name']?.trim()
            const associateId = row['Delivery Associate ID']?.trim()
            
            if (!name || !associateId) {
              results.errors.push({
                row: results.total,
                name: name || 'Unknown',
                error: 'Missing required fields: name or associate ID'
              })
              return
            }
            
            // Generate email from name
            const emailName = name.toLowerCase()
              .replace(/[^a-z\s]/g, '')
              .replace(/\s+/g, '.')
            const email = `${emailName}@company.com`
            
            drivers.push({
              driver_id: associateId,
              name,
              email,
              phone: '+1234567890', // Default phone
              license_number: `DL${associateId.slice(-6)}`, // Generate license from associate ID
              status: 'Active',
              join_date: new Date().toISOString().split('T')[0],
              employment_type: 'Fulltime',
              annual_vacation_days: 25
            })
          })
          .on('end', async () => {
            try {
              // Insert drivers into database
              for (const driver of drivers) {
                try {
                  // Check if driver already exists by driver_id or email
                  const existing = await dbGet(
                    'SELECT id, driver_id FROM drivers WHERE driver_id = ? OR email = ?',
                    [driver.driver_id, driver.email]
                  )
                  
                  if (existing) {
                    // Skip existing driver - don't update or import
                    results.errors.push({
                      row: drivers.indexOf(driver) + 1,
                      name: driver.name,
                      error: `Driver already exists with ID: ${existing.driver_id} - skipped to prevent duplication`
                    })
                    continue
                  }
                  
                  // Insert new driver only if they don't exist
                  await dbRun(`
                    INSERT INTO drivers (
                      driver_id, name, email, phone, license_number, status, 
                      join_date, employment_type, annual_vacation_days, used_vacation_days
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `, [
                    driver.driver_id, driver.name, driver.email, driver.phone,
                    driver.license_number, driver.status, driver.join_date,
                    driver.employment_type, driver.annual_vacation_days, 0
                  ])
                  results.imported++
                } catch (dbError: any) {
                  results.errors.push({
                    row: drivers.indexOf(driver) + 1,
                    name: driver.name,
                    error: `Database error: ${dbError.message}`
                  })
                }
              }
              
              // Clean up uploaded file
              fs.unlinkSync(filePath)
              resolve()
            } catch (error) {
              reject(error)
            }
          })
          .on('error', (error) => {
            reject(error)
          })
      })
    }

    await processCSV()

    // Send response
    if (results.errors.length > 0 && results.imported === 0) {
      return res.status(400).json({
        error: 'Import failed',
        results,
        errors: results.errors.map(e => e.error)
      })
    }

    const message = results.imported > 0 
      ? `Import completed successfully. ${results.imported} new drivers imported.${results.errors.length > 0 ? ` ${results.errors.length} drivers were skipped (already exist).` : ''}`
      : `No new drivers imported. ${results.errors.length} drivers were skipped (already exist).`

    res.json({
      message,
      imported: results.imported,
      results
    })

  } catch (error: any) {
    console.error('Error importing drivers:', error)
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    
    res.status(500).json({ 
      error: 'Import failed',
      message: error.message 
    })
  }
})

// Bulk import from JSON data
router.post('/drivers/bulk', async (req, res) => {
  try {
    const { drivers } = req.body
    
    if (!drivers || !Array.isArray(drivers)) {
      return res.status(400).json({ error: 'Drivers array is required' })
    }

    const results: ImportResults = {
      total: drivers.length,
      imported: 0,
      updated: 0,
      errors: []
    }

    for (let i = 0; i < drivers.length; i++) {
      const driverData = drivers[i]
      
      try {
        // Validate required fields
        if (!driverData.name || !driverData.driver_id) {
          results.errors.push({
            row: i + 1,
            name: driverData.name || 'Unknown',
            error: 'Missing required fields: name and driver_id'
          })
          continue
        }

        // Check if driver already exists by driver_id
        const existingDriver = await dbGet(
          'SELECT id, driver_id FROM drivers WHERE driver_id = ?',
          [driverData.driver_id]
        )

        if (existingDriver) {
          // Skip existing driver - don't update or import
          results.errors.push({
            row: i + 1,
            name: driverData.name,
            error: `Driver already exists with ID: ${existingDriver.driver_id} - skipped to prevent duplication`
          })
          continue
        }
        
        // Insert new driver only if they don't exist
        await dbRun(`
          INSERT INTO drivers (
            driver_id, name, email, phone, license_number, status, 
            join_date, employment_type, annual_vacation_days, used_vacation_days
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          driverData.driver_id,
          driverData.name,
          driverData.email || `${driverData.driver_id.toLowerCase()}@company.com`,
          driverData.phone || '+49000000000',
          driverData.license_number || `LIC-${driverData.driver_id}`,
          driverData.status || 'Active',
          driverData.join_date || new Date().toISOString().split('T')[0],
          driverData.employment_type || 'Fulltime',
          driverData.annual_vacation_days || 25,
          0
        ])
        results.imported++
      } catch (error) {
        results.errors.push({
          row: i + 1,
          name: driverData.name || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    res.json({
      message: 'Bulk import completed',
      results
    })
  } catch (error) {
    console.error('Error in bulk import:', error)
    res.status(500).json({ error: 'Failed to import drivers' })
  }
})

// CSV file upload and import
router.post('/drivers/csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' })
    }

    const results: ImportResults = {
      total: 0,
      imported: 0,
      updated: 0,
      errors: []
    }

    const csvData: any[] = []
    
    // Parse CSV file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(req.file!.path)
        .pipe(csv())
        .on('data', (row: any) => {
          results.total++
          csvData.push(row)
        })
        .on('end', resolve)
        .on('error', reject)
    })

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      
      try {
        // Validate CSV row
        const validatedData = csvDriverSchema.parse(row)
        
        const driverData = {
          name: validatedData['Delivery Associate Name'].trim(),
          driver_id: validatedData['Delivery Associate ID'].trim(),
          email: `${validatedData['Delivery Associate ID'].toLowerCase()}@company.com`,
          phone: '+49000000000',
          license_number: `LIC-${validatedData['Delivery Associate ID']}`,
          status: 'Active',
          join_date: new Date().toISOString().split('T')[0],
          employment_type: 'Fulltime',
          annual_vacation_days: 25
        }

        // Check if driver already exists
        const existingDriver = await dbGet(
          'SELECT id, driver_id FROM drivers WHERE driver_id = ?',
          [driverData.driver_id]
        )

        if (existingDriver) {
          // Skip existing driver - don't update or import
          results.errors.push({
            row: i + 2, // +2 because CSV has header row and arrays are 0-indexed
            name: driverData.name,
            error: `Driver already exists with ID: ${existingDriver.driver_id} - skipped to prevent duplication`
          })
          continue
        }
        
        // Insert new driver only if they don't exist
        await dbRun(`
          INSERT INTO drivers (
            driver_id, name, email, phone, license_number, status, 
            join_date, employment_type, annual_vacation_days, used_vacation_days
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          driverData.driver_id,
          driverData.name,
          driverData.email,
          driverData.phone,
          driverData.license_number,
          driverData.status,
          driverData.join_date,
          driverData.employment_type,
          driverData.annual_vacation_days,
          0
        ])
        results.imported++
      } catch (error) {
        results.errors.push({
          row: i + 2, // +2 because CSV has header row and arrays are 0-indexed
          name: row['Delivery Associate Name'] || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path)

    res.json({
      message: 'CSV import completed',
      results
    })
  } catch (error) {
    console.error('Error importing CSV:', error)
    res.status(500).json({ error: 'Failed to import CSV file' })
  }
})

// Get import templates
router.get('/templates/drivers-csv', (req, res) => {
  const csvTemplate = `"Delivery Associate Name","Delivery Associate ID"
"John Doe","A1234567890123"
"Jane Smith","B9876543210987"`

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="drivers_import_template.csv"')
  res.send(csvTemplate)
})

export default router
