import express from 'express'
import { dbAll, dbGet, dbRun } from '../database/database.js'

const router = express.Router()

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const { user_id, is_read, is_global, limit = 50 } = req.query

    let query = `
      SELECT 
        n.*,
        d.name as driver_name,
        d.driver_id as driver_code
      FROM notifications n
      LEFT JOIN drivers d ON n.driver_id = d.id
      WHERE (n.expires_at IS NULL OR n.expires_at > datetime('now'))
    `
    const params: any[] = []

    if (user_id) {
      query += ` AND (n.user_id = ? OR n.is_global = 1)`
      params.push(user_id)
    } else {
      query += ` AND n.is_global = 1`
    }

    if (is_read !== undefined) {
      query += ` AND n.is_read = ?`
      params.push(is_read === 'true' ? 1 : 0)
    }

    if (is_global !== undefined) {
      query += ` AND n.is_global = ?`
      params.push(is_global === 'true' ? 1 : 0)
    }

    query += ` ORDER BY n.created_at DESC LIMIT ?`
    params.push(parseInt(limit as string))

    const notifications = await dbAll(query, params)
    
    res.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Get notification counts
router.get('/counts', async (req, res) => {
  try {
    const { user_id } = req.query

    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread,
        COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warnings,
        COUNT(CASE WHEN severity = 'error' THEN 1 END) as errors
      FROM notifications 
      WHERE (expires_at IS NULL OR expires_at > datetime('now'))
    `
    const params: any[] = []

    if (user_id) {
      query += ` AND (user_id = ? OR is_global = 1)`
      params.push(user_id)
    } else {
      query += ` AND is_global = 1`
    }

    const counts = await dbGet(query, params)
    
    res.json(counts)
  } catch (error) {
    console.error('Error fetching notification counts:', error)
    res.status(500).json({ error: 'Failed to fetch notification counts' })
  }
})

// Get single notification
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const notification = await dbGet(`
      SELECT 
        n.*,
        d.name as driver_name,
        d.driver_id as driver_code
      FROM notifications n
      LEFT JOIN drivers d ON n.driver_id = d.id
      WHERE n.id = ?
    `, [id])
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    
    res.json(notification)
  } catch (error) {
    console.error('Error fetching notification:', error)
    res.status(500).json({ error: 'Failed to fetch notification' })
  }
})

// Create new notification
router.post('/', async (req, res) => {
  try {
    const { 
      user_id, 
      driver_id, 
      type, 
      title, 
      message, 
      icon = 'Bell',
      severity = 'info',
      is_global = false,
      action_url,
      action_label,
      metadata,
      expires_at
    } = req.body
    
    if (!type || !title || !message) {
      return res.status(400).json({ error: 'Type, title, and message are required' })
    }
    
    const result = await dbRun(`
      INSERT INTO notifications (
        user_id, driver_id, type, title, message, icon, severity, 
        is_global, action_url, action_label, metadata, expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id || null,
      driver_id || null,
      type,
      title,
      message,
      icon,
      severity,
      is_global ? 1 : 0,
      action_url || null,
      action_label || null,
      metadata || null,
      expires_at || null
    ])
    
    // Get the last inserted row ID from sqlite
    const lastIdResult = await dbGet('SELECT last_insert_rowid() as id')
    const insertedId = lastIdResult?.id
    
    if (!insertedId) {
      throw new Error('Failed to create notification - no ID returned')
    }
    
    const newNotification = await dbGet(`
      SELECT 
        n.*,
        d.name as driver_name,
        d.driver_id as driver_code
      FROM notifications n
      LEFT JOIN drivers d ON n.driver_id = d.id
      WHERE n.id = ?
    `, [insertedId])
    
    res.status(201).json(newNotification)
  } catch (error) {
    console.error('Error creating notification:', error)
    res.status(500).json({ error: 'Failed to create notification' })
  }
})

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if notification exists
    const notification = await dbGet(
      'SELECT id FROM notifications WHERE id = ?',
      [id]
    )
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    
    await dbRun(`
      UPDATE notifications 
      SET is_read = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id])
    
    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

// Mark all notifications as read for a user
router.patch('/read-all', async (req, res) => {
  try {
    const { user_id } = req.body
    
    let query = `
      UPDATE notifications 
      SET is_read = 1, updated_at = CURRENT_TIMESTAMP
      WHERE is_read = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
    `
    const params: any[] = []

    if (user_id) {
      query += ` AND (user_id = ? OR is_global = 1)`
      params.push(user_id)
    } else {
      query += ` AND is_global = 1`
    }
    
    await dbRun(query, params)
    
    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
})

// Delete notification (soft delete by setting expiry)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if notification exists
    const notification = await dbGet(
      'SELECT id FROM notifications WHERE id = ?',
      [id]
    )
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    
    // Soft delete by setting expiry to now
    await dbRun(`
      UPDATE notifications 
      SET expires_at = datetime('now'), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id])
    
    res.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

// Clear expired notifications (cleanup endpoint)
router.delete('/cleanup/expired', async (req, res) => {
  try {
    const result = await dbRun(`
      DELETE FROM notifications 
      WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')
    `)
    
    res.json({ 
      message: 'Expired notifications cleaned up',
      deleted_count: result.changes
    })
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error)
    res.status(500).json({ error: 'Failed to clean up expired notifications' })
  }
})

export default router
