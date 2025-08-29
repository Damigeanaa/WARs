import express from 'express'
import { z } from 'zod'
import { dbGet, dbAll } from '../database/database.js'

const router = express.Router()

// Query parameters validation
const auditQuerySchema = z.object({
  table_name: z.string().optional(),
  action: z.string().optional().refine(val => !val || ['CREATE', 'UPDATE', 'DELETE'].includes(val), {
    message: "Action must be one of: CREATE, UPDATE, DELETE"
  }),
  user_id: z.string().transform(Number).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.string().optional().default('100').transform(Number),
  offset: z.string().optional().default('0').transform(Number)
})

// GET /api/audit-logs - Get audit logs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const queryParams = auditQuerySchema.parse(req.query)
    
    let whereConditions: string[] = []
    let queryValues: any[] = []
    
    // Build WHERE clause based on query parameters
    if (queryParams.table_name) {
      whereConditions.push('table_name = ?')
      queryValues.push(queryParams.table_name)
    }
    
    if (queryParams.action) {
      whereConditions.push('action = ?')
      queryValues.push(queryParams.action)
    }
    
    if (queryParams.user_id) {
      whereConditions.push('user_id = ?')
      queryValues.push(queryParams.user_id)
    }
    
    if (queryParams.start_date) {
      whereConditions.push('created_at >= ?')
      queryValues.push(queryParams.start_date)
    }
    
    if (queryParams.end_date) {
      whereConditions.push('created_at <= ?')
      queryValues.push(queryParams.end_date)
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : ''
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs 
      ${whereClause}
    `
    const countResult = await dbGet(countQuery, queryValues)
    const total = countResult.total
    
    // Get audit logs with pagination
    const auditLogsQuery = `
      SELECT 
        al.*,
        u.username,
        u.email as user_full_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `
    
    const auditLogs = await dbAll(auditLogsQuery, [
      ...queryValues,
      queryParams.limit,
      queryParams.offset
    ])
    
    // Parse JSON fields
    const parsedAuditLogs = auditLogs.map(log => ({
      ...log,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null
    }))
    
    res.json({
      audit_logs: parsedAuditLogs,
      pagination: {
        total,
        limit: queryParams.limit,
        offset: queryParams.offset,
        has_more: (queryParams.offset + queryParams.limit) < total
      }
    })
    
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
})

// GET /api/audit-logs/stats - Get audit statistics
router.get('/stats', async (req, res) => {
  try {
    // Get action counts
    const actionStats = await dbAll(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
    `)

    // Get table counts
    const tableStats = await dbAll(`
      SELECT table_name, COUNT(*) as count
      FROM audit_logs
      GROUP BY table_name
      ORDER BY count DESC
    `)

    // Get recent activity (last 7 days)
    const recentActivity = await dbGet(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= datetime('now', '-7 days')
    `)

    // Get top users by email (simplified since we may not have users table)
    const userStats = await dbAll(`
      SELECT 
        user_email,
        COUNT(*) as count
      FROM audit_logs
      WHERE user_email IS NOT NULL AND user_email != ''
      GROUP BY user_email
      ORDER BY count DESC
      LIMIT 5
    `)

    res.json({
      action_stats: actionStats,
      table_stats: tableStats,
      recent_activity: recentActivity?.count || 0,
      user_stats: userStats
    })

  } catch (error) {
    console.error('Error fetching audit stats:', error)
    res.status(500).json({ error: 'Failed to fetch audit stats' })
  }
})

// GET /api/audit-logs/:id - Get specific audit log entry
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const auditLog = await dbGet(`
      SELECT 
        al.*,
        u.username,
        u.email as user_full_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = ?
    `, [id])
    
    if (!auditLog) {
      return res.status(404).json({ error: 'Audit log entry not found' })
    }
    
    // Parse JSON fields
    const parsedAuditLog = {
      ...auditLog,
      old_values: auditLog.old_values ? JSON.parse(auditLog.old_values) : null,
      new_values: auditLog.new_values ? JSON.parse(auditLog.new_values) : null
    }
    
    res.json(parsedAuditLog)
    
  } catch (error) {
    console.error('Error fetching audit log:', error)
    res.status(500).json({ error: 'Failed to fetch audit log' })
  }
})

// GET /api/audit-logs/record/:tableName/:recordId - Get audit history for specific record
router.get('/record/:tableName/:recordId', async (req, res) => {
  try {
    const { tableName, recordId } = req.params
    
    const auditLogs = await dbAll(`
      SELECT 
        al.*,
        u.username,
        u.email as user_full_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.table_name = ? AND al.record_id = ?
      ORDER BY al.created_at DESC
    `, [tableName, recordId])
    
    // Parse JSON fields
    const parsedAuditLogs = auditLogs.map(log => ({
      ...log,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null
    }))
    
    res.json(parsedAuditLogs)
    
  } catch (error) {
    console.error('Error fetching record audit history:', error)
    res.status(500).json({ error: 'Failed to fetch record audit history' })
  }
})

export default router
