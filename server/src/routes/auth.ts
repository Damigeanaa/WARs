import express from 'express'
import { z } from 'zod'
import { dbRun, dbGet } from '../database/database.js'

const router = express.Router()

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'manager']).optional()
})

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body)
    
    // Find user by email
    const user = await dbGet(`
      SELECT * FROM users WHERE email = ?
    `, [validatedData.email])

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // For demo purposes, allow 'admin123' for the admin user or direct password comparison
    // In a real app, you would properly hash and compare passwords with bcrypt
    const isValidPassword = 
      (user.email === 'admin@company.com' && validatedData.password === 'admin123') ||
      user.password_hash === validatedData.password

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Remove password from response and map username to name for frontend compatibility
    const { password_hash, username, ...userWithoutPassword } = user
    
    res.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        name: username // Map username to name for frontend compatibility
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Error during login:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// POST /api/auth/register - User registration
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body)
    
    // Check if user already exists
    const existingUser = await dbGet(`
      SELECT id FROM users WHERE email = ?
    `, [validatedData.email])

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' })
    }

    // Insert new user
    await dbRun(`
      INSERT INTO users (email, password, name, role)
      VALUES (?, ?, ?, ?)
    `, [
      validatedData.email,
      validatedData.password, // In real app, this would be hashed
      validatedData.name,
      validatedData.role || 'manager'
    ])

    // Get the created user
    const newUser = await dbGet(`
      SELECT id, email, name, role, created_at FROM users WHERE email = ?
    `, [validatedData.email])
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors })
    }
    console.error('Error during registration:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// GET /api/auth/me - Get current user (if implementing sessions)
router.get('/me', async (req, res) => {
  // This would typically check a session or JWT token
  // For demo purposes, return a placeholder
  res.json({
    user: {
      id: 1,
      email: 'admin@company.com',
      name: 'Fleet Administrator', // Using name instead of username for consistency
      role: 'admin'
    }
  })
})

export default router
