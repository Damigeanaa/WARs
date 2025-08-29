import express from 'express'
import { dbAll, dbGet, dbRun } from '../database/database.js'

const router = express.Router()

// Get all warning templates
router.get('/', async (req, res) => {
  try {
    const { category_id, is_active } = req.query

    let query = `
      SELECT 
        wt.*,
        wc.name as category_name,
        wc.color as category_color,
        wc.icon as category_icon
      FROM warning_templates wt
      LEFT JOIN warning_categories wc ON wt.category_id = wc.id
      WHERE 1=1
    `
    const params: any[] = []

    if (category_id) {
      query += ` AND wt.category_id = ?`
      params.push(category_id)
    }

    if (is_active !== undefined) {
      query += ` AND wt.is_active = ?`
      params.push(is_active === 'true' ? 1 : 0)
    }

    query += ` ORDER BY wt.usage_count DESC, wt.name ASC`

    const templates = await dbAll(query, params)
    
    res.json(templates)
  } catch (error) {
    console.error('Error fetching warning templates:', error)
    res.status(500).json({ error: 'Failed to fetch warning templates' })
  }
})

// Get single warning template
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const template = await dbGet(`
      SELECT 
        wt.*,
        wc.name as category_name,
        wc.color as category_color,
        wc.icon as category_icon
      FROM warning_templates wt
      LEFT JOIN warning_categories wc ON wt.category_id = wc.id
      WHERE wt.id = ?
    `, [id])
    
    if (!template) {
      return res.status(404).json({ error: 'Warning template not found' })
    }
    
    res.json(template)
  } catch (error) {
    console.error('Error fetching warning template:', error)
    res.status(500).json({ error: 'Failed to fetch warning template' })
  }
})

// Create new warning template
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      category_id, 
      type, 
      description, 
      severity, 
      location_placeholder, 
      expiration_days,
      created_by 
    } = req.body
    
    if (!name || !type || !description) {
      return res.status(400).json({ error: 'Name, type, and description are required' })
    }
    
    // Check if template with same name already exists
    const existingTemplate = await dbGet(
      'SELECT id FROM warning_templates WHERE name = ? AND is_active = 1',
      [name]
    )
    
    if (existingTemplate) {
      return res.status(400).json({ error: 'Template with this name already exists' })
    }
    
    await dbRun(`
      INSERT INTO warning_templates (
        name, category_id, type, description, severity, 
        location_placeholder, expiration_days, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, 
      category_id || null, 
      type, 
      description, 
      severity || 'Medium',
      location_placeholder || null,
      expiration_days || null,
      created_by || 'User'
    ])
    
    // Get the last inserted row ID from sqlite
    const lastIdResult = await dbGet('SELECT last_insert_rowid() as id')
    const insertedId = lastIdResult?.id

    if (!insertedId) {
      throw new Error('Failed to create warning template - no ID returned')
    }
    
    const newTemplate = await dbGet(`
      SELECT 
        wt.*,
        wc.name as category_name,
        wc.color as category_color,
        wc.icon as category_icon
      FROM warning_templates wt
      LEFT JOIN warning_categories wc ON wt.category_id = wc.id
      WHERE wt.id = ?
    `, [insertedId])
    
    res.status(201).json(newTemplate)
  } catch (error) {
    console.error('Error creating warning template:', error)
    res.status(500).json({ error: 'Failed to create warning template' })
  }
})

// Update warning template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { 
      name, 
      category_id, 
      type, 
      description, 
      severity, 
      location_placeholder, 
      expiration_days,
      is_active 
    } = req.body
    
    // Check if template exists
    const existingTemplate = await dbGet(
      'SELECT id FROM warning_templates WHERE id = ?',
      [id]
    )
    
    if (!existingTemplate) {
      return res.status(404).json({ error: 'Warning template not found' })
    }
    
    // Check if name is taken by another template
    if (name) {
      const duplicateTemplate = await dbGet(
        'SELECT id FROM warning_templates WHERE name = ? AND id != ? AND is_active = 1',
        [name, id]
      )
      
      if (duplicateTemplate) {
        return res.status(400).json({ error: 'Template with this name already exists' })
      }
    }
    
    await dbRun(`
      UPDATE warning_templates 
      SET 
        name = COALESCE(?, name),
        category_id = COALESCE(?, category_id),
        type = COALESCE(?, type),
        description = COALESCE(?, description),
        severity = COALESCE(?, severity),
        location_placeholder = COALESCE(?, location_placeholder),
        expiration_days = COALESCE(?, expiration_days),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, category_id, type, description, severity, location_placeholder, expiration_days, is_active, id])
    
    const updatedTemplate = await dbGet(`
      SELECT 
        wt.*,
        wc.name as category_name,
        wc.color as category_color,
        wc.icon as category_icon
      FROM warning_templates wt
      LEFT JOIN warning_categories wc ON wt.category_id = wc.id
      WHERE wt.id = ?
    `, [id])
    
    res.json(updatedTemplate)
  } catch (error) {
    console.error('Error updating warning template:', error)
    res.status(500).json({ error: 'Failed to update warning template' })
  }
})

// Delete warning template (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if template exists
    const template = await dbGet(
      'SELECT id, usage_count FROM warning_templates WHERE id = ?',
      [id]
    )
    
    if (!template) {
      return res.status(404).json({ error: 'Warning template not found' })
    }
    
    if (template.usage_count > 0) {
      // Soft delete if template has been used
      await dbRun(`
        UPDATE warning_templates 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id])
      
      res.json({ 
        message: 'Warning template deactivated (template has been used)',
        deactivated: true
      })
    } else {
      // Hard delete if template has never been used
      await dbRun('DELETE FROM warning_templates WHERE id = ?', [id])
      res.json({ message: 'Warning template deleted successfully', deleted: true })
    }
  } catch (error) {
    console.error('Error deleting warning template:', error)
    res.status(500).json({ error: 'Failed to delete warning template' })
  }
})

// Use template (increment usage count)
router.post('/:id/use', async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if template exists and is active
    const template = await dbGet(
      'SELECT id FROM warning_templates WHERE id = ? AND is_active = 1',
      [id]
    )
    
    if (!template) {
      return res.status(404).json({ error: 'Warning template not found or inactive' })
    }
    
    // Increment usage count
    await dbRun(`
      UPDATE warning_templates 
      SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id])
    
    res.json({ message: 'Template usage recorded successfully' })
  } catch (error) {
    console.error('Error recording template usage:', error)
    res.status(500).json({ error: 'Failed to record template usage' })
  }
})

// Get template usage statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params
    
    const stats = await dbGet(`
      SELECT 
        wt.usage_count,
        wt.created_at,
        wt.updated_at,
        wt.created_by,
        COUNT(w.id) as warnings_created
      FROM warning_templates wt
      LEFT JOIN warnings w ON w.type = wt.type AND w.description LIKE '%' || REPLACE(wt.description, '[%]', '%') || '%'
      WHERE wt.id = ?
      GROUP BY wt.id
    `, [id])
    
    if (!stats) {
      return res.status(404).json({ error: 'Warning template not found' })
    }
    
    res.json(stats)
  } catch (error) {
    console.error('Error fetching template stats:', error)
    res.status(500).json({ error: 'Failed to fetch template statistics' })
  }
})

export default router
