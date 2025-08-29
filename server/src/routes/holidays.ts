import express from 'express'
import { z } from 'zod'
import { dbRun, dbGet, dbAll } from '../database/database.js'

const router = express.Router()

// Validation schemas
const holidaySchema = z.object({
  driver_id: z.number().positive(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  days: z.number().positive(),
  type: z.enum(['Annual Leave', 'Sick Leave', 'Personal Leave', 'Emergency Leave']).optional(),
  status: z.enum(['Pending', 'Approved', 'Rejected']).optional(),
  reason: z.string().optional(),
  request_date: z.string().min(1, 'Request date is required')
})

// GET /api/holidays - Get all holiday requests
router.get('/', async (req, res) => {
  try {
    const holidays = await dbAll(`
      SELECT 
        h.*,
        d.name as driver_name,
        d.email as driver_email,
        d.employment_type,
        d.annual_vacation_days,
        d.used_vacation_days,
        (d.annual_vacation_days - d.used_vacation_days) as remaining_vacation_days
      FROM holidays h
      JOIN drivers d ON h.driver_id = d.id
      ORDER BY h.request_date DESC
    `)
    res.json(holidays)
  } catch (error) {
    console.error('Error fetching holidays:', error)
    res.status(500).json({ error: 'Failed to fetch holidays' })
  }
})

// GET /api/holidays/driver/:driverId - Get holidays for specific driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params
    const holidays = await dbAll(`
      SELECT h.*, d.name as driver_name
      FROM holidays h
      JOIN drivers d ON h.driver_id = d.id
      WHERE h.driver_id = ?
      ORDER BY h.start_date DESC
    `, [driverId])
    res.json(holidays)
  } catch (error) {
    console.error('Error fetching driver holidays:', error)
    res.status(500).json({ error: 'Failed to fetch driver holidays' })
  }
})

// GET /api/holidays/pending - Get pending holiday requests
router.get('/pending', async (req, res) => {
  try {
    const pendingHolidays = await dbAll(`
      SELECT 
        h.*,
        d.name as driver_name,
        d.email as driver_email
      FROM holidays h
      JOIN drivers d ON h.driver_id = d.id
      WHERE h.status = 'Pending'
      ORDER BY h.request_date ASC
    `)
    res.json(pendingHolidays)
  } catch (error) {
    console.error('Error fetching pending holidays:', error)
    res.status(500).json({ error: 'Failed to fetch pending holidays' })
  }
})

// POST /api/holidays - Create new holiday request
router.post('/', async (req, res) => {
  try {
    const validatedData = holidaySchema.parse(req.body)
    
    const result = await dbRun(`
      INSERT INTO holidays (driver_id, start_date, end_date, days, type, status, reason, request_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      validatedData.driver_id,
      validatedData.start_date,
      validatedData.end_date,
      validatedData.days,
      validatedData.type || 'Annual Leave',
      validatedData.status || 'Pending',
      validatedData.reason || null,
      validatedData.request_date
    ])

    // Get the inserted holiday with driver information
    const newHoliday = await dbGet(`
      SELECT h.*, d.name as driver_name, d.email as driver_email
      FROM holidays h
      JOIN drivers d ON h.driver_id = d.id
      WHERE h.driver_id = ? AND h.start_date = ? AND h.end_date = ? AND h.request_date = ?
      ORDER BY h.id DESC
      LIMIT 1
    `, [validatedData.driver_id, validatedData.start_date, validatedData.end_date, validatedData.request_date])
    
    res.status(201).json(newHoliday)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Error creating holiday:', error)
    res.status(500).json({ error: 'Failed to create holiday request' })
  }
})

// PUT /api/holidays/:id - Update holiday request
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = holidaySchema.partial().parse(req.body)

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
      UPDATE holidays 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, updateValues)

    const updatedHoliday = await dbGet(`
      SELECT h.*, d.name as driver_name
      FROM holidays h
      JOIN drivers d ON h.driver_id = d.id
      WHERE h.id = ?
    `, [id])
    
    res.json(updatedHoliday)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Error updating holiday:', error)
    res.status(500).json({ error: 'Failed to update holiday request' })
  }
})

// PUT /api/holidays/:id/approve - Approve holiday request
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get holiday details first
    const holiday = await dbGet(`
      SELECT h.*, d.used_vacation_days, d.annual_vacation_days
      FROM holidays h
      JOIN drivers d ON h.driver_id = d.id
      WHERE h.id = ?
    `, [id])
    
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday request not found' })
    }

    // Check if driver has enough vacation days (only for approved holidays)
    const remainingDays = holiday.annual_vacation_days - holiday.used_vacation_days
    if (remainingDays < holiday.days) {
      return res.status(400).json({ 
        error: 'Insufficient vacation days', 
        details: `Driver has only ${remainingDays} days remaining, but requested ${holiday.days} days` 
      })
    }
    
    // Update holiday status
    await dbRun(`
      UPDATE holidays 
      SET status = 'Approved', approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id])

    // Update driver's used vacation days
    await dbRun(`
      UPDATE drivers 
      SET used_vacation_days = used_vacation_days + ?
      WHERE id = ?
    `, [holiday.days, holiday.driver_id])

    const approvedHoliday = await dbGet(`
      SELECT h.*, d.name as driver_name, d.email as driver_email
      FROM holidays h
      JOIN drivers d ON h.driver_id = d.id
      WHERE h.id = ?
    `, [id])

    res.json(approvedHoliday)
  } catch (error) {
    console.error('Error approving holiday:', error)
    res.status(500).json({ error: 'Failed to approve holiday request' })
  }
})

// PUT /api/holidays/:id/reject - Reject holiday request
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get holiday details first to check if it was previously approved
    const holiday = await dbGet(`
      SELECT h.*, d.name as driver_name
      FROM holidays h
      JOIN drivers d ON h.driver_id = d.id
      WHERE h.id = ?
    `, [id])
    
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday request not found' })
    }

    // If the holiday was previously approved, restore the vacation days
    if (holiday.status === 'Approved') {
      await dbRun(`
        UPDATE drivers 
        SET used_vacation_days = used_vacation_days - ?
        WHERE id = ?
      `, [holiday.days, holiday.driver_id])
    }
    
    await dbRun(`
      UPDATE holidays 
      SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id])

    const rejectedHoliday = await dbGet(`
      SELECT h.*, d.name as driver_name, d.email as driver_email
      FROM holidays h
      JOIN drivers d ON h.driver_id = d.id
      WHERE h.id = ?
    `, [id])

    res.json(rejectedHoliday)
  } catch (error) {
    console.error('Error rejecting holiday:', error)
    res.status(500).json({ error: 'Failed to reject holiday request' })
  }
})

// DELETE /api/holidays/:id - Delete holiday request
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const holiday = await dbGet('SELECT * FROM holidays WHERE id = ?', [id])
    if (!holiday) {
      return res.status(404).json({ error: 'Holiday request not found' })
    }

    // If the holiday was approved, restore the vacation days
    if (holiday.status === 'Approved') {
      await dbRun(`
        UPDATE drivers 
        SET used_vacation_days = used_vacation_days - ?
        WHERE id = ?
      `, [holiday.days, holiday.driver_id])
    }

    await dbRun('DELETE FROM holidays WHERE id = ?', [id])
    res.json({ message: 'Holiday request deleted successfully' })
  } catch (error) {
    console.error('Error deleting holiday:', error)
    res.status(500).json({ error: 'Failed to delete holiday request' })
  }
})

// GET /api/holidays/driver/:driverId/vacation-summary - Get vacation summary for driver
router.get('/driver/:driverId/vacation-summary', async (req, res) => {
  try {
    const { driverId } = req.params
    
    // Get driver's vacation info
    const driver = await dbGet(`
      SELECT id, name, employment_type, annual_vacation_days, used_vacation_days
      FROM drivers 
      WHERE id = ?
    `, [driverId])
    
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' })
    }

    // Get approved holidays for this year
    const currentYear = new Date().getFullYear()
    const approvedHolidays = await dbAll(`
      SELECT h.*, h.days as days_taken, h.start_date, h.end_date, h.type, h.approved_at
      FROM holidays h
      WHERE h.driver_id = ? 
        AND h.status = 'Approved'
        AND strftime('%Y', h.start_date) = ?
      ORDER BY h.start_date DESC
    `, [driverId, currentYear.toString()])

    const summary = {
      driver: {
        id: driver.id,
        name: driver.name,
        employment_type: driver.employment_type
      },
      vacation_allowance: {
        annual_days: driver.annual_vacation_days,
        used_days: driver.used_vacation_days,
        remaining_days: driver.annual_vacation_days - driver.used_vacation_days
      },
      holiday_history: approvedHolidays,
      year: currentYear
    }

    res.json(summary)
  } catch (error) {
    console.error('Error fetching vacation summary:', error)
    res.status(500).json({ error: 'Failed to fetch vacation summary' })
  }
})

// GET /api/holidays/analytics - Get holiday analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const analytics = await dbAll(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(days) as total_days
      FROM holidays 
      GROUP BY status
      ORDER BY count DESC
    `)
    
    const typeAnalytics = await dbAll(`
      SELECT 
        type,
        COUNT(*) as count,
        AVG(days) as avg_days
      FROM holidays 
      GROUP BY type
      ORDER BY count DESC
    `)

    const monthlyTrends = await dbAll(`
      SELECT 
        strftime('%Y-%m', start_date) as month,
        COUNT(*) as requests,
        SUM(days) as total_days
      FROM holidays 
      WHERE start_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', start_date)
      ORDER BY month
    `)

    res.json({
      status_breakdown: analytics,
      type_analytics: typeAnalytics,
      monthly_trends: monthlyTrends
    })
  } catch (error) {
    console.error('Error fetching holiday analytics:', error)
    res.status(500).json({ error: 'Failed to fetch holiday analytics' })
  }
})

export { router as holidaysRouter }
