import { Router } from 'express'
import { z } from 'zod'
import { dbRun, dbGet, dbAll } from '../database/database.js'
import { logCreate, logUpdate, logDelete } from '../middleware/auditLogger.js'

const router = Router()

// Validation schema for public holiday requests
const publicHolidayRequestSchema = z.object({
  driverName: z.string().min(1, 'Driver name is required'),
  driverId: z.string().min(1, 'Driver ID is required'),
  department: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required'),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
  requestedDays: z.number().min(1),
  status: z.string().default('pending'),
  submittedAt: z.string()
})

// Submit a public holiday request (no authentication required)
router.post('/public', async (req, res) => {
  try {
    console.log('Received public holiday request:', req.body)
    
    const validatedData = publicHolidayRequestSchema.parse(req.body)
    
    // Check if driver ID already has a pending request for overlapping dates
    const existingRequest = await dbGet(`
      SELECT id FROM holiday_requests 
      WHERE driver_id = ? 
      AND status = 'pending'
      AND (
        (start_date <= ? AND end_date >= ?) OR
        (start_date <= ? AND end_date >= ?) OR
        (start_date >= ? AND end_date <= ?)
      )
    `, [
      validatedData.driverId,
      validatedData.startDate, validatedData.startDate,
      validatedData.endDate, validatedData.endDate,
      validatedData.startDate, validatedData.endDate
    ])

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'You already have a pending holiday request for overlapping dates' 
      })
    }

    // Insert the holiday request
    await dbRun(`
      INSERT INTO holiday_requests (
        driver_name, driver_id, department,
        start_date, end_date, reason, emergency_contact, emergency_phone,
        notes, requested_days, status, submitted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      validatedData.driverName,
      validatedData.driverId,
      validatedData.department || null,
      validatedData.startDate,
      validatedData.endDate,
      validatedData.reason,
      validatedData.emergencyContact || null,
      validatedData.emergencyPhone || null,
      validatedData.notes || null,
      validatedData.requestedDays,
      validatedData.status,
      validatedData.submittedAt
    ])

    // Get the last inserted row ID from sqlite
    const lastIdResult = await dbGet('SELECT last_insert_rowid() as id')
    const insertedId = lastIdResult?.id

    if (!insertedId) {
      throw new Error('Failed to create holiday request - no ID returned')
    }

    // Create notification for the new holiday request
    try {
      await dbRun(`
        INSERT INTO notifications (
          type, title, message, icon, severity, 
          is_global, action_url, action_label, driver_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'holiday_request',
        'New Holiday Request',
        `${validatedData.driverName} (${validatedData.driverId}) has submitted a holiday request for ${validatedData.requestedDays} days from ${validatedData.startDate} to ${validatedData.endDate}`,
        'Calendar',
        'info',
        1, // is_global = true, so it appears for all users
        '/holidays',
        'Review Request',
        null // We'll set this to null since we're using driver_id from the form, not the database driver ID
      ])
      console.log('✅ Notification created for holiday request')
    } catch (notificationError) {
      console.error('⚠️ Failed to create notification:', notificationError)
      // Don't fail the request if notification creation fails
    }

    // Log the audit trail for holiday request creation
    const newRequest = {
      id: insertedId,
      ...validatedData,
      created_at: new Date().toISOString()
    }
    await logCreate(req, 'holiday_requests', insertedId, newRequest)

    res.status(201).json({
      message: 'Holiday request submitted successfully',
      requestId: insertedId,
      status: 'pending'
    })

  } catch (error) {
    console.error('Error submitting public holiday request:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to submit holiday request. Please try again.' 
    })
  }
})

// Get all public holiday requests (for management dashboard)
router.get('/public/all', async (req, res) => {
  try {
    const requests = await dbAll(`
      SELECT 
        id,
        driver_name,
        driver_id,
        department,
        start_date,
        end_date,
        reason,
        emergency_contact,
        emergency_phone,
        notes,
        requested_days,
        status,
        submitted_at,
        approved_by,
        approved_at,
        created_at
      FROM holiday_requests 
      ORDER BY submitted_at DESC
    `)

    res.json(requests)
  } catch (error) {
    console.error('Error fetching public holiday requests:', error)
    res.status(500).json({ error: 'Failed to fetch holiday requests' })
  }
})

// Update holiday request status (for management)
router.put('/public/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, approvedBy, notes } = req.body

    console.log('Updating holiday request:', { id, status, approvedBy, notes })

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Get existing holiday request before updating
    const existingRequest = await dbGet('SELECT * FROM holiday_requests WHERE id = ?', [id])
    if (!existingRequest) {
      return res.status(404).json({ error: 'Holiday request not found' })
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved' && approvedBy) {
      updateData.approved_by = approvedBy
      updateData.approved_at = new Date().toISOString()
    }

    if (notes) {
      updateData.management_notes = notes
    }

    console.log('Update data:', updateData)

    const result = await dbRun(`
      UPDATE holiday_requests 
      SET status = ?, 
          approved_by = ?, 
          approved_at = ?, 
          management_notes = ?,
          updated_at = ?
      WHERE id = ?
    `, [
      updateData.status,
      updateData.approved_by || null,
      updateData.approved_at || null,
      updateData.management_notes || null,
      updateData.updated_at,
      id
    ])

    console.log('Update result:', result)

    if (!result || result.changes === 0) {
      return res.status(404).json({ error: 'Holiday request not found' })
    }

    // Get updated holiday request for audit log
    const updatedRequest = await dbGet('SELECT * FROM holiday_requests WHERE id = ?', [id])
    
    // Log the audit trail for holiday request status update
    await logUpdate(req, 'holiday_requests', parseInt(id), existingRequest, updatedRequest)

    res.json({ 
      message: `Holiday request ${status} successfully`,
      requestId: id 
    })

  } catch (error) {
    console.error('Error updating holiday request status:', error)
    res.status(500).json({ error: 'Failed to update holiday request' })
  }
})

// Get holiday request by driver ID (for checking status)
router.get('/public/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params

    const requests = await dbAll(`
      SELECT 
        id,
        driver_name,
        driver_id,
        start_date,
        end_date,
        reason,
        requested_days,
        status,
        submitted_at,
        approved_by,
        approved_at,
        management_notes
      FROM holiday_requests 
      WHERE driver_id = ?
      ORDER BY submitted_at DESC
    `, [driverId])

    res.json(requests)
  } catch (error) {
    console.error('Error fetching driver holiday requests:', error)
    res.status(500).json({ error: 'Failed to fetch holiday requests' })
  }
})

// DELETE /api/holiday-requests/public/:id - Delete a holiday request
router.delete('/public/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if the holiday request exists
    const holidayRequest = await dbGet('SELECT * FROM holiday_requests WHERE id = ?', [id])
    if (!holidayRequest) {
      return res.status(404).json({ error: 'Holiday request not found' })
    }

    // Delete the holiday request
    await dbRun('DELETE FROM holiday_requests WHERE id = ?', [id])
    
    // Log the audit trail for holiday request deletion
    await logDelete(req, 'holiday_requests', parseInt(id), holidayRequest)
    
    res.json({ message: 'Holiday request deleted successfully' })
  } catch (error) {
    console.error('Error deleting holiday request:', error)
    res.status(500).json({ error: 'Failed to delete holiday request' })
  }
})

export default router
