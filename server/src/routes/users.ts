import express from 'express'
import { z } from 'zod'
import { dbRun, dbGet, dbAll } from '../database/database.js'

const router = express.Router()

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional()
}).refine((data) => {
  // If newPassword is provided, currentPassword must also be provided
  if (data.newPassword && !data.currentPassword) {
    return false
  }
  return true
}, {
  message: "Current password is required when changing password",
  path: ["currentPassword"]
})

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const user = await dbGet(`
      SELECT id, username, email, role, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `, [userId])

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Map username to name for frontend compatibility
    const { username, ...userWithoutUsername } = user
    
    res.json({
      user: {
        ...userWithoutUsername,
        name: username
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const validatedData = updateUserSchema.parse(req.body)
    
    // Check if user exists
    const existingUser = await dbGet(`
      SELECT * FROM users WHERE id = ?
    `, [userId])

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // If updating password, verify current password
    if (validatedData.newPassword && validatedData.currentPassword) {
      // For demo purposes, check if current password matches
      // In a real app, you would properly hash and compare passwords
      const isValidPassword = 
        (existingUser.email === 'admin@company.com' && validatedData.currentPassword === 'admin123') ||
        existingUser.password_hash === validatedData.currentPassword

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' })
      }
    }

    // Prepare update fields
    const updateFields: string[] = []
    const updateValues: any[] = []

    if (validatedData.name !== undefined) {
      updateFields.push('username = ?')
      updateValues.push(validatedData.name)
    }

    if (validatedData.email !== undefined) {
      // Check if email is already in use by another user
      const emailExists = await dbGet(`
        SELECT id FROM users WHERE email = ? AND id != ?
      `, [validatedData.email, userId])

      if (emailExists) {
        return res.status(409).json({ error: 'Email is already in use by another account' })
      }

      updateFields.push('email = ?')
      updateValues.push(validatedData.email)
    }

    if (validatedData.newPassword) {
      updateFields.push('password_hash = ?')
      updateValues.push(validatedData.newPassword) // In real app, this would be hashed
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(userId) // For WHERE clause

    if (updateFields.length === 1) { // Only updated_at was added
      return res.status(400).json({ error: 'No fields to update' })
    }

    // Execute update
    await dbRun(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues)

    // Fetch updated user
    const updatedUser = await dbGet(`
      SELECT id, username, email, role, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `, [userId])

    // Map username to name for frontend compatibility
    const { username, ...userWithoutUsername } = updatedUser
    
    res.json({
      message: 'User updated successfully',
      user: {
        ...userWithoutUsername,
        name: username
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      })
    }
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// GET /api/users - Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT id, username, email, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `, [])

    // Map username to name for frontend compatibility
    const mappedUsers = users.map((user: any) => {
      const { username, ...userWithoutUsername } = user
      return {
        ...userWithoutUsername,
        name: username
      }
    })
    
    res.json({ users: mappedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

export default router
