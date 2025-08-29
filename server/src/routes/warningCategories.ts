import express from 'express'
import { dbAll, dbGet, dbRun } from '../database/database.js'

const router = express.Router()

// Get all warning categories
router.get('/', async (req, res) => {
  try {
    const categories = await dbAll(`
      SELECT 
        id,
        name,
        description,
        color,
        icon,
        is_active,
        created_at,
        updated_at
      FROM warning_categories 
      WHERE is_active = 1
      ORDER BY name ASC
    `)
    
    res.json(categories)
  } catch (error) {
    console.error('Error fetching warning categories:', error)
    res.status(500).json({ error: 'Failed to fetch warning categories' })
  }
})

// Get single warning category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const category = await dbGet(`
      SELECT 
        id,
        name,
        description,
        color,
        icon,
        is_active,
        created_at,
        updated_at
      FROM warning_categories 
      WHERE id = ?
    `, [id])
    
    if (!category) {
      return res.status(404).json({ error: 'Warning category not found' })
    }
    
    res.json(category)
  } catch (error) {
    console.error('Error fetching warning category:', error)
    res.status(500).json({ error: 'Failed to fetch warning category' })
  }
})

// Create new warning category
router.post('/', async (req, res) => {
  try {
    const { name, description, color, icon } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' })
    }
    
    // Check if category with same name already exists
    const existingCategory = await dbGet(
      'SELECT id FROM warning_categories WHERE name = ? AND is_active = 1',
      [name]
    )
    
    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists' })
    }
    
    await dbRun(`
      INSERT INTO warning_categories (name, description, color, icon)
      VALUES (?, ?, ?, ?)
    `, [name, description || null, color || '#6B7280', icon || 'AlertTriangle'])
    
    // Get the last inserted row ID from sqlite
    const lastIdResult = await dbGet('SELECT last_insert_rowid() as id')
    const insertedId = lastIdResult?.id

    if (!insertedId) {
      throw new Error('Failed to create warning category - no ID returned')
    }
    
    const newCategory = await dbGet(`
      SELECT 
        id,
        name,
        description,
        color,
        icon,
        is_active,
        created_at,
        updated_at
      FROM warning_categories 
      WHERE id = ?
    `, [insertedId])
    
    res.status(201).json(newCategory)
  } catch (error) {
    console.error('Error creating warning category:', error)
    res.status(500).json({ error: 'Failed to create warning category' })
  }
})

// Update warning category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, color, icon, is_active } = req.body
    
    // Check if category exists
    const existingCategory = await dbGet(
      'SELECT id FROM warning_categories WHERE id = ?',
      [id]
    )
    
    if (!existingCategory) {
      return res.status(404).json({ error: 'Warning category not found' })
    }
    
    // Check if name is taken by another category
    if (name) {
      const duplicateCategory = await dbGet(
        'SELECT id FROM warning_categories WHERE name = ? AND id != ? AND is_active = 1',
        [name, id]
      )
      
      if (duplicateCategory) {
        return res.status(400).json({ error: 'Category with this name already exists' })
      }
    }
    
    await dbRun(`
      UPDATE warning_categories 
      SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        color = COALESCE(?, color),
        icon = COALESCE(?, icon),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, color, icon, is_active, id])
    
    const updatedCategory = await dbGet(`
      SELECT 
        id,
        name,
        description,
        color,
        icon,
        is_active,
        created_at,
        updated_at
      FROM warning_categories 
      WHERE id = ?
    `, [id])
    
    res.json(updatedCategory)
  } catch (error) {
    console.error('Error updating warning category:', error)
    res.status(500).json({ error: 'Failed to update warning category' })
  }
})

// Delete warning category (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if category exists
    const category = await dbGet(
      'SELECT id FROM warning_categories WHERE id = ?',
      [id]
    )
    
    if (!category) {
      return res.status(404).json({ error: 'Warning category not found' })
    }
    
    // Check if category is being used by any warnings
    const warningsUsingCategory = await dbGet(
      'SELECT COUNT(*) as count FROM warnings WHERE category_id = ?',
      [id]
    )
    
    if (warningsUsingCategory.count > 0) {
      // Soft delete - set is_active to false
      await dbRun(`
        UPDATE warning_categories 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id])
      
      res.json({ 
        message: 'Warning category deactivated (warnings still reference this category)',
        deactivated: true
      })
    } else {
      // Hard delete if no warnings reference this category
      await dbRun('DELETE FROM warning_categories WHERE id = ?', [id])
      res.json({ message: 'Warning category deleted successfully', deleted: true })
    }
  } catch (error) {
    console.error('Error deleting warning category:', error)
    res.status(500).json({ error: 'Failed to delete warning category' })
  }
})

// Get warnings count by category
router.get('/:id/warnings-count', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await dbGet(`
      SELECT 
        COUNT(*) as total_warnings,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_warnings,
        COUNT(CASE WHEN severity = 'High' THEN 1 END) as high_severity_warnings
      FROM warnings 
      WHERE category_id = ?
    `, [id])
    
    res.json(result)
  } catch (error) {
    console.error('Error fetching category warnings count:', error)
    res.status(500).json({ error: 'Failed to fetch warnings count' })
  }
})

export default router
