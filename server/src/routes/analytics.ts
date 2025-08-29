import express from 'express'
import { dbAll, dbGet } from '../database/database.js'

const router = express.Router()

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    // Get driver statistics
    const driverStats = await dbGet(`
      SELECT 
        COUNT(*) as total_drivers,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_drivers,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive_drivers
      FROM drivers
    `)

    // Get warning statistics
    const warningStats = await dbGet(`
      SELECT 
        COUNT(*) as total_warnings,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_warnings,
        SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high_severity_warnings,
        SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) as medium_severity_warnings,
        SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) as low_severity_warnings
      FROM warnings
    `)

    // Get holiday statistics
    const holidayStats = await dbGet(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests
      FROM holiday_requests
    `)

    // Get recent activity
    const recentWarnings = await dbAll(`
      SELECT w.*, d.name as driver_name
      FROM warnings w
      LEFT JOIN drivers d ON w.driver_id = d.id
      ORDER BY w.created_at DESC
      LIMIT 5
    `)

    const recentHolidayRequests = await dbAll(`
      SELECT hr.*, d.name as driver_name
      FROM holiday_requests hr
      LEFT JOIN drivers d ON hr.driver_id = d.id
      ORDER BY hr.created_at DESC
      LIMIT 5
    `)

    res.json({
      drivers: driverStats || {
        total_drivers: 0,
        active_drivers: 0,
        inactive_drivers: 0
      },
      warnings: warningStats || {
        total_warnings: 0,
        active_warnings: 0,
        high_severity_warnings: 0,
        medium_severity_warnings: 0,
        low_severity_warnings: 0
      },
      holidays: holidayStats || {
        total_requests: 0,
        pending_requests: 0,
        approved_requests: 0,
        rejected_requests: 0
      },
      recent_activity: {
        warnings: recentWarnings || [],
        holiday_requests: recentHolidayRequests || []
      },
      last_updated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' })
  }
})

export { router as analyticsRouter }
