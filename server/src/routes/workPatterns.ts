import { Router } from 'express'
import { z } from 'zod'
import { dbRun, dbGet, dbAll } from '../database/database.js'
import { logCreate, logUpdate, logDelete } from '../middleware/auditLogger.js'

const router = Router()

// Validation schema for work patterns
const workPatternSchema = z.object({
  driver_id: z.number(),
  type: z.enum(['monday-friday', 'mixed-tours', 'specific-tour-only', 'monday-friday-mixed', 'custom']),
  work_days: z.string().optional().nullable(),
  allowed_tours: z.string().optional().nullable(),
  preferred_tour: z.string().optional().nullable()
})

// GET /api/work-patterns - Get all work patterns
router.get('/', async (req, res) => {
  try {
    const patterns = await dbAll(`
      SELECT 
        wp.*,
        d.name as driver_name,
        d.driver_id as driver_code
      FROM driver_work_patterns wp
      LEFT JOIN drivers d ON wp.driver_id = d.id
      ORDER BY d.name
    `)
    
    // Parse JSON fields
    const parsedPatterns = patterns.map(pattern => ({
      ...pattern,
      work_days: pattern.work_days ? JSON.parse(pattern.work_days) : null,
      allowed_tours: pattern.allowed_tours ? JSON.parse(pattern.allowed_tours) : null
    }))
    
    res.json(parsedPatterns)
  } catch (error) {
    console.error('Error fetching work patterns:', error)
    res.status(500).json({ error: 'Failed to fetch work patterns' })
  }
})

// GET /api/work-patterns/driver/:driverId - Get work pattern for specific driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params
    
    const pattern = await dbGet(`
      SELECT 
        wp.*,
        d.name as driver_name,
        d.driver_id as driver_code
      FROM driver_work_patterns wp
      LEFT JOIN drivers d ON wp.driver_id = d.id
      WHERE wp.driver_id = ?
    `, [driverId])

    if (!pattern) {
      return res.status(404).json({ error: 'Work pattern not found' })
    }

    // Parse JSON fields
    const parsedPattern = {
      ...pattern,
      work_days: pattern.work_days ? JSON.parse(pattern.work_days) : null,
      allowed_tours: pattern.allowed_tours ? JSON.parse(pattern.allowed_tours) : null
    }

    res.json(parsedPattern)
  } catch (error) {
    console.error('Error fetching work pattern:', error)
    res.status(500).json({ error: 'Failed to fetch work pattern' })
  }
})

// POST /api/work-patterns - Create or update work pattern
router.post('/', async (req, res) => {
  try {
    const validatedData = workPatternSchema.parse(req.body)

    // Check if pattern already exists for this driver
    const existing = await dbGet(
      'SELECT id FROM driver_work_patterns WHERE driver_id = ?',
      [validatedData.driver_id]
    )

    const workDaysJson = validatedData.work_days ? validatedData.work_days : null
    const allowedToursJson = validatedData.allowed_tours ? validatedData.allowed_tours : null

    if (existing) {
      // Update existing pattern
      const currentData = await dbGet('SELECT * FROM driver_work_patterns WHERE id = ?', [existing.id])
      
      await dbRun(`
        UPDATE driver_work_patterns 
        SET type = ?, work_days = ?, allowed_tours = ?, preferred_tour = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [
        validatedData.type,
        workDaysJson,
        allowedToursJson,
        validatedData.preferred_tour || null,
        existing.id
      ])

      const updatedData = await dbGet('SELECT * FROM driver_work_patterns WHERE id = ?', [existing.id])
      await logUpdate(req, 'driver_work_patterns', existing.id, currentData, updatedData)
      
      // Parse JSON fields for response
      const parsedPattern = {
        ...updatedData,
        work_days: updatedData.work_days ? JSON.parse(updatedData.work_days) : null,
        allowed_tours: updatedData.allowed_tours ? JSON.parse(updatedData.allowed_tours) : null
      }
      
      res.json({ message: 'Work pattern updated successfully', data: parsedPattern })
    } else {
      // Create new pattern
      const result = await dbRun(`
        INSERT INTO driver_work_patterns (driver_id, type, work_days, allowed_tours, preferred_tour)
        VALUES (?, ?, ?, ?, ?)
      `, [
        validatedData.driver_id,
        validatedData.type,
        workDaysJson,
        allowedToursJson,
        validatedData.preferred_tour || null
      ])

      const newPattern = await dbGet('SELECT * FROM driver_work_patterns WHERE id = ?', [result.lastID])
      await logCreate(req, 'driver_work_patterns', result.lastID!, newPattern)
      
      // Parse JSON fields for response
      const parsedPattern = {
        ...newPattern,
        work_days: newPattern.work_days ? JSON.parse(newPattern.work_days) : null,
        allowed_tours: newPattern.allowed_tours ? JSON.parse(newPattern.allowed_tours) : null
      }
      
      res.status(201).json({ message: 'Work pattern created successfully', data: parsedPattern })
    }
  } catch (error) {
    console.error('Error saving work pattern:', error)
    res.status(500).json({ error: 'Failed to save work pattern' })
  }
})

// DELETE /api/work-patterns/driver/:driverId - Delete work pattern for driver
router.delete('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params

    const existing = await dbGet('SELECT * FROM driver_work_patterns WHERE driver_id = ?', [driverId])
    if (!existing) {
      return res.status(404).json({ error: 'Work pattern not found' })
    }

    await dbRun('DELETE FROM driver_work_patterns WHERE driver_id = ?', [driverId])
    await logDelete(req, 'driver_work_patterns', existing.id, existing)

    res.json({ message: 'Work pattern deleted successfully' })
  } catch (error) {
    console.error('Error deleting work pattern:', error)
    res.status(500).json({ error: 'Failed to delete work pattern' })
  }
})

export { router as workPatternsRouter }
