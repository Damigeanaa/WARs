import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import { driversRouter } from './routes/drivers.js'
import { warningsRouter } from './routes/warnings.js'
import { holidaysRouter } from './routes/holidays.js'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import holidayRequestsRouter from './routes/holidayRequests.js'
import importRouter from './routes/import.js'
import warningCategoriesRouter from './routes/warningCategories.js'
import warningTemplatesRouter from './routes/warningTemplates.js'
import notificationsRouter from './routes/notifications.js'
import { analyticsRouter } from './routes/analytics.js'
import auditLogsRouter from './routes/auditLogs.js'
import { initializeDatabase } from './database/init.js'
import { auditMiddleware, extractUserForAudit } from './middleware/auditLogger.js'
import { errorHandler } from './utils/validation.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-vercel-app.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}))
app.use(express.json())

// Audit middleware
app.use(auditMiddleware)
app.use(extractUserForAudit)

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Routes
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/drivers', driversRouter)
app.use('/api/warnings', warningsRouter)
app.use('/api/warning-categories', warningCategoriesRouter)
app.use('/api/warning-templates', warningTemplatesRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/holidays', holidaysRouter)
app.use('/api/holiday-requests', holidayRequestsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/audit-logs', auditLogsRouter)
app.use('/api/import', importRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Enhanced error handling middleware
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  })
})

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase()
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📊 API available at http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
