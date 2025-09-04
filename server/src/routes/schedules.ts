import { Router } from 'express'
import { z } from 'zod'
import { dbRun, dbGet, dbAll } from '../database/database.js'
import { logCreate, logUpdate, logDelete } from '../middleware/auditLogger.js'

const router = Router()

// Validation schema for schedule entries
const scheduleEntrySchema = z.object({
  driver_id: z.number(),
  schedule_date: z.string(),
  status: z.enum(['available', 'scheduled', 'holiday', 'sick', 'unavailable']),
  van_assigned: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
})

// GET /api/schedules - Get all schedule entries for a date range
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, year, week } = req.query

    let query = `
      SELECT 
        s.*,
        d.name as driver_name,
        d.driver_id as driver_code
      FROM driver_schedules s
      LEFT JOIN drivers d ON s.driver_id = d.id
      WHERE 1=1
    `
    const params: any[] = []

    if (start_date && end_date) {
      query += ` AND s.schedule_date BETWEEN ? AND ?`
      params.push(start_date, end_date)
    }

    if (year && week) {
      // Calculate date range for specific week
      const startOfYear = new Date(parseInt(year as string), 0, 1)
      const startOfWeek = new Date(startOfYear)
      startOfWeek.setDate(startOfYear.getDate() + (parseInt(week as string) - 1) * 7)
      
      // Find the Monday of this week
      const dayOfWeek = startOfWeek.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      startOfWeek.setDate(startOfWeek.getDate() + mondayOffset)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      query += ` AND s.schedule_date BETWEEN ? AND ?`
      params.push(
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0]
      )
    }

    query += ` ORDER BY s.schedule_date, d.name`

    const schedules = await dbAll(query, params)
    res.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    res.status(500).json({ error: 'Failed to fetch schedules' })
  }
})

// GET /api/schedules/:id - Get schedule entry by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const schedule = await dbGet(`
      SELECT 
        s.*,
        d.name as driver_name,
        d.driver_id as driver_code
      FROM driver_schedules s
      LEFT JOIN drivers d ON s.driver_id = d.id
      WHERE s.id = ?
    `, [id])

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule entry not found' })
    }

    res.json(schedule)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    res.status(500).json({ error: 'Failed to fetch schedule' })
  }
})

// POST /api/schedules - Create new schedule entry
router.post('/', async (req, res) => {
  try {
    const validatedData = scheduleEntrySchema.parse(req.body)

    // Check if entry already exists for this driver and date
    const existing = await dbGet(
      'SELECT id FROM driver_schedules WHERE driver_id = ? AND schedule_date = ?',
      [validatedData.driver_id, validatedData.schedule_date]
    )

    if (existing) {
      return res.status(400).json({ 
        error: 'Schedule entry already exists for this driver and date' 
      })
    }

    // Insert new schedule entry
    const result = await dbRun(`
      INSERT INTO driver_schedules (
        driver_id, schedule_date, status, van_assigned, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [
      validatedData.driver_id,
      validatedData.schedule_date,
      validatedData.status,
      validatedData.van_assigned || null,
      validatedData.notes || null
    ])

    // Get the created entry
    const created = await dbGet(
      'SELECT * FROM driver_schedules WHERE id = ?',
      [result.lastID]
    )

    // Log the creation
    await logCreate(req, 'driver_schedules', result.lastID, created)

    res.status(201).json(created)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      })
    }
    console.error('Error creating schedule:', error)
    res.status(500).json({ error: 'Failed to create schedule entry' })
  }
})

// PUT /api/schedules/bulk - Bulk update or create schedule entries
router.put('/bulk', async (req, res) => {
  try {
    console.log('=== BULK SCHEDULE REQUEST DEBUG ===')
    console.log('req.body:', JSON.stringify(req.body, null, 2))
    console.log('req.body type:', typeof req.body)
    console.log('entries exists:', 'entries' in req.body)
    console.log('entries type:', typeof req.body.entries)
    console.log('entries is array:', Array.isArray(req.body.entries))
    
    const { entries } = req.body
    
    if (!Array.isArray(entries)) {
      console.log('Error: entries is not an array:', typeof entries, entries)
      return res.status(400).json({ error: 'Entries must be an array' })
    }

    console.log('Processing', entries.length, 'entries')
    const results = []
    
    for (const [index, entry] of entries.entries()) {
      console.log(`Processing entry ${index}:`, JSON.stringify(entry, null, 2))
      console.log(`Entry type: ${typeof entry}`)
      console.log(`Entry driver_id: ${entry.driver_id} (${typeof entry.driver_id})`)
      console.log(`Entry schedule_date: ${entry.schedule_date} (${typeof entry.schedule_date})`)
      console.log(`Entry status: ${entry.status} (${typeof entry.status})`)
      
      const validatedData = scheduleEntrySchema.parse(entry)
      
      // Check if entry exists
      const existing = await dbGet(
        'SELECT id FROM driver_schedules WHERE driver_id = ? AND schedule_date = ?',
        [validatedData.driver_id, validatedData.schedule_date]
      )

      if (existing) {
        // Update existing entry
        const currentData = await dbGet('SELECT * FROM driver_schedules WHERE id = ?', [existing.id])
        
        await dbRun(`
          UPDATE driver_schedules 
          SET status = ?, van_assigned = ?, notes = ?, updated_at = datetime('now')
          WHERE id = ?
        `, [
          validatedData.status,
          validatedData.van_assigned || null,
          validatedData.notes || null,
          existing.id
        ])

        const updatedData = await dbGet('SELECT * FROM driver_schedules WHERE id = ?', [existing.id])
        await logUpdate(req, 'driver_schedules', existing.id, currentData, updatedData)
        
        results.push({ action: 'updated', id: existing.id, data: updatedData })
      } else {
        // Create new entry
        const result = await dbRun(`
          INSERT INTO driver_schedules (
            driver_id, schedule_date, status, van_assigned, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [
          validatedData.driver_id,
          validatedData.schedule_date,
          validatedData.status,
          validatedData.van_assigned || null,
          validatedData.notes || null
        ])

        const created = await dbGet('SELECT * FROM driver_schedules WHERE id = ?', [result.lastID])
        await logCreate(req, 'driver_schedules', result.lastID, created)
        
        results.push({ action: 'created', id: result.lastID, data: created })
      }
    }

    res.json({ success: true, results })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.errors)
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      })
    }
    console.error('Error bulk updating schedules:', error)
    res.status(500).json({ error: 'Failed to update schedule entries' })
  }
})

// PUT /api/schedules/:id - Update schedule entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = scheduleEntrySchema.parse(req.body)

    // Get current data for audit
    const currentData = await dbGet('SELECT * FROM driver_schedules WHERE id = ?', [id])
    if (!currentData) {
      return res.status(404).json({ error: 'Schedule entry not found' })
    }

    // Update schedule entry
    await dbRun(`
      UPDATE driver_schedules 
      SET driver_id = ?, schedule_date = ?, status = ?, van_assigned = ?, 
          notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      validatedData.driver_id,
      validatedData.schedule_date,
      validatedData.status,
      validatedData.van_assigned || null,
      validatedData.notes || null,
      id
    ])

    // Get updated data
    const updatedData = await dbGet('SELECT * FROM driver_schedules WHERE id = ?', [id])

    // Log the update
    await logUpdate(req, 'driver_schedules', parseInt(id), currentData, updatedData)

    res.json(updatedData)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      })
    }
    console.error('Error updating schedule:', error)
    res.status(500).json({ error: 'Failed to update schedule entry' })
  }
})

// DELETE /api/schedules/:id - Delete schedule entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Get current data for audit
    const currentData = await dbGet('SELECT * FROM driver_schedules WHERE id = ?', [id])
    if (!currentData) {
      return res.status(404).json({ error: 'Schedule entry not found' })
    }

    // Delete schedule entry
    await dbRun('DELETE FROM driver_schedules WHERE id = ?', [id])

    // Log the deletion
    await logDelete(req, 'driver_schedules', parseInt(id), currentData)

    res.json({ message: 'Schedule entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    res.status(500).json({ error: 'Failed to delete schedule entry' })
  }
})

// GET /api/schedules/summary/:driver_id - Get schedule summary for a driver
router.get('/summary/:driver_id', async (req, res) => {
  try {
    const { driver_id } = req.params
    const { year } = req.query

    let query = `
      SELECT 
        status,
        COUNT(*) as count,
        GROUP_CONCAT(schedule_date) as dates
      FROM driver_schedules
      WHERE driver_id = ?
    `
    const params = [driver_id]

    if (year) {
      query += ` AND strftime('%Y', schedule_date) = ?`
      params.push(year as string)
    }

    query += ` GROUP BY status`

    const summary = await dbAll(query, params)
    res.json(summary)
  } catch (error) {
    console.error('Error fetching schedule summary:', error)
    res.status(500).json({ error: 'Failed to fetch schedule summary' })
  }
})

export { router as schedulesRouter }
