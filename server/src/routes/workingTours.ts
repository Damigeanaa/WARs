import { Router } from 'express'
import { z } from 'zod'
import { dbRun, dbGet, dbAll } from '../database/database.js'
import { logCreate, logUpdate, logDelete } from '../middleware/auditLogger.js'

const router = Router()

// Validation schema for working tours
const workingTourSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  is_active: z.boolean().optional().default(true)
})

// GET /api/working-tours - Get all working tours
router.get('/', async (req, res) => {
  try {
    const tours = await dbAll(`
      SELECT * FROM working_tours 
      ORDER BY is_active DESC, name ASC
    `)
    res.json(tours)
  } catch (error) {
    console.error('Error fetching working tours:', error)
    res.status(500).json({ error: 'Failed to fetch working tours' })
  }
})

// GET /api/working-tours/:id - Get working tour by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const tour = await dbGet('SELECT * FROM working_tours WHERE id = ?', [id])

    if (!tour) {
      return res.status(404).json({ error: 'Working tour not found' })
    }

    res.json(tour)
  } catch (error) {
    console.error('Error fetching working tour:', error)
    res.status(500).json({ error: 'Failed to fetch working tour' })
  }
})

// POST /api/working-tours - Create new working tour
router.post('/', async (req, res) => {
  try {
    const validatedData = workingTourSchema.parse(req.body)

    // Check if tour name already exists
    const existing = await dbGet(
      'SELECT id FROM working_tours WHERE name = ?',
      [validatedData.name]
    )

    if (existing) {
      return res.status(400).json({ 
        error: 'Working tour with this name already exists' 
      })
    }

    // Insert new working tour
    const result = await dbRun(`
      INSERT INTO working_tours (
        name, description, color, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      validatedData.name,
      validatedData.description || null,
      validatedData.color,
      validatedData.is_active
    ])

    // Get the created tour
    const created = await dbGet(
      'SELECT * FROM working_tours WHERE id = ?',
      [result.lastID]
    )

    // Log the creation
    await logCreate(req, 'working_tours', result.lastID, created)

    res.status(201).json(created)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      })
    }
    console.error('Error creating working tour:', error)
    res.status(500).json({ error: 'Failed to create working tour' })
  }
})

// POST /api/working-tours/bulk - Create multiple working tours
router.post('/bulk', async (req, res) => {
  try {
    const { tours } = req.body
    
    if (!Array.isArray(tours)) {
      return res.status(400).json({ error: 'Tours must be an array' })
    }

    const results = []
    
    for (const tour of tours) {
      const validatedData = workingTourSchema.parse(tour)
      
      // Check if tour name already exists
      const existing = await dbGet(
        'SELECT id FROM working_tours WHERE name = ?',
        [validatedData.name]
      )

      if (!existing) {
        // Insert new working tour
        const result = await dbRun(`
          INSERT INTO working_tours (
            name, description, color, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          validatedData.name,
          validatedData.description || null,
          validatedData.color,
          validatedData.is_active
        ])

        const created = await dbGet('SELECT * FROM working_tours WHERE id = ?', [result.lastID])
        await logCreate(req, 'working_tours', result.lastID, created)
        
        results.push({ action: 'created', id: result.lastID, data: created })
      } else {
        results.push({ action: 'skipped', reason: 'name_exists', name: validatedData.name })
      }
    }

    res.json({ success: true, results })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      })
    }
    console.error('Error bulk creating working tours:', error)
    res.status(500).json({ error: 'Failed to create working tours' })
  }
})

// PUT /api/working-tours/:id - Update working tour
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Handle partial updates (like status toggle)
    if (req.body.is_active !== undefined && Object.keys(req.body).length === 1) {
      // Simple status update
      const { is_active } = req.body
      
      const currentData = await dbGet('SELECT * FROM working_tours WHERE id = ?', [id])
      if (!currentData) {
        return res.status(404).json({ error: 'Working tour not found' })
      }

      await dbRun(`
        UPDATE working_tours 
        SET is_active = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [is_active, id])

      const updatedData = await dbGet('SELECT * FROM working_tours WHERE id = ?', [id])
      await logUpdate(req, 'working_tours', parseInt(id), currentData, updatedData)

      return res.json(updatedData)
    }

    // Full validation for complete updates
    const validatedData = workingTourSchema.parse(req.body)

    // Get current data for audit
    const currentData = await dbGet('SELECT * FROM working_tours WHERE id = ?', [id])
    if (!currentData) {
      return res.status(404).json({ error: 'Working tour not found' })
    }

    // Check if tour name already exists (excluding current tour)
    const existing = await dbGet(
      'SELECT id FROM working_tours WHERE name = ? AND id != ?',
      [validatedData.name, id]
    )

    if (existing) {
      return res.status(400).json({ 
        error: 'Working tour with this name already exists' 
      })
    }

    // Update working tour
    await dbRun(`
      UPDATE working_tours 
      SET name = ?, description = ?, color = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      validatedData.name,
      validatedData.description || null,
      validatedData.color,
      validatedData.is_active,
      id
    ])

    // Get updated data
    const updatedData = await dbGet('SELECT * FROM working_tours WHERE id = ?', [id])

    // Log the update
    await logUpdate(req, 'working_tours', parseInt(id), currentData, updatedData)

    res.json(updatedData)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      })
    }
    console.error('Error updating working tour:', error)
    res.status(500).json({ error: 'Failed to update working tour' })
  }
})

// DELETE /api/working-tours/:id - Delete working tour
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Get current data for audit
    const currentData = await dbGet('SELECT * FROM working_tours WHERE id = ?', [id])
    if (!currentData) {
      return res.status(404).json({ error: 'Working tour not found' })
    }

    // Check if tour is being used in schedules by name (van_assigned column)
    const usageByName = await dbGet(
      'SELECT COUNT(*) as count FROM driver_schedules WHERE van_assigned = ?',
      [currentData.name]
    )

    // Check if tour is being used in schedules by ID (working_tour_id column)
    const usageById = await dbGet(
      'SELECT COUNT(*) as count FROM driver_schedules WHERE working_tour_id = ?',
      [id]
    )

    const totalUsage = (usageByName?.count || 0) + (usageById?.count || 0)

    if (totalUsage > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete working tour that is being used in schedules',
        usage_count: totalUsage,
        usage_by_name: usageByName?.count || 0,
        usage_by_id: usageById?.count || 0
      })
    }

    // Delete working tour
    await dbRun('DELETE FROM working_tours WHERE id = ?', [id])

    // Log the deletion
    await logDelete(req, 'working_tours', parseInt(id), currentData)

    res.json({ message: 'Working tour deleted successfully' })
  } catch (error) {
    console.error('Error deleting working tour:', error)
    res.status(500).json({ 
      error: 'Failed to delete working tour',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /api/working-tours/active/list - Get only active working tours
router.get('/active/list', async (req, res) => {
  try {
    const tours = await dbAll(`
      SELECT * FROM working_tours 
      WHERE is_active = 1
      ORDER BY name ASC
    `)
    res.json(tours)
  } catch (error) {
    console.error('Error fetching active working tours:', error)
    res.status(500).json({ error: 'Failed to fetch active working tours' })
  }
})

export { router as workingToursRouter }
