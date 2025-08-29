import { Request, Response, NextFunction } from 'express'
import { dbRun } from '../database/database.js'

interface AuditLogEntry {
  tableName: string
  recordId: number
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  oldValues?: any
  newValues?: any
  userId?: number
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  endpoint?: string
  method?: string
}

// Extend Express Request to include audit context
declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        tableName?: string
        recordId?: number
        oldValues?: any
        newValues?: any
        userId?: number
        userEmail?: string
      }
    }
  }
}

/**
 * Middleware to capture request information for audit logging
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Initialize audit context
  req.auditContext = {}
  next()
}

/**
 * Log an audit entry to the database
 */
export async function logAuditEntry({
  tableName,
  recordId,
  action,
  oldValues,
  newValues,
  userId,
  userEmail,
  ipAddress,
  userAgent,
  sessionId,
  endpoint,
  method
}: AuditLogEntry): Promise<void> {
  try {
    await dbRun(`
      INSERT INTO audit_logs (
        table_name, record_id, action, old_values, new_values,
        user_id, user_email, ip_address, user_agent, session_id,
        endpoint, method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tableName,
      recordId,
      action,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      userId || null,
      userEmail || null,
      ipAddress || null,
      userAgent || null,
      sessionId || null,
      endpoint || null,
      method || null
    ])
  } catch (error) {
    console.error('Failed to log audit entry:', error)
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Helper function to log CREATE operations
 */
export async function logCreate(
  req: Request,
  tableName: string,
  recordId: number,
  newValues: any
): Promise<void> {
  await logAuditEntry({
    tableName,
    recordId,
    action: 'CREATE',
    newValues,
    userId: req.auditContext?.userId,
    userEmail: req.auditContext?.userEmail,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    sessionId: req.headers['x-session-id'] as string || undefined,
    endpoint: req.originalUrl,
    method: req.method
  })
}

/**
 * Helper function to log UPDATE operations
 */
export async function logUpdate(
  req: Request,
  tableName: string,
  recordId: number,
  oldValues: any,
  newValues: any
): Promise<void> {
  await logAuditEntry({
    tableName,
    recordId,
    action: 'UPDATE',
    oldValues,
    newValues,
    userId: req.auditContext?.userId,
    userEmail: req.auditContext?.userEmail,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    sessionId: req.headers['x-session-id'] as string || undefined,
    endpoint: req.originalUrl,
    method: req.method
  })
}

/**
 * Helper function to log DELETE operations
 */
export async function logDelete(
  req: Request,
  tableName: string,
  recordId: number,
  oldValues: any
): Promise<void> {
  await logAuditEntry({
    tableName,
    recordId,
    action: 'DELETE',
    oldValues,
    userId: req.auditContext?.userId,
    userEmail: req.auditContext?.userEmail,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    sessionId: req.headers['x-session-id'] as string || undefined,
    endpoint: req.originalUrl,
    method: req.method
  })
}

/**
 * Set user context for audit logging (usually called after authentication)
 */
export function setAuditUser(req: Request, userId: number, userEmail: string): void {
  if (!req.auditContext) {
    req.auditContext = {}
  }
  req.auditContext.userId = userId
  req.auditContext.userEmail = userEmail
}

/**
 * Middleware to extract user information from JWT token for audit logging
 */
export const extractUserForAudit = (req: Request, res: Response, next: NextFunction) => {
  // Try to extract user info from authorization header
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // In a real app, you'd decode the JWT token here
      // For now, we'll use a placeholder approach
      const token = authHeader.substring(7)
      
      // This is a simplified approach - in production you'd verify and decode the JWT
      // For development, we'll extract user info from headers or use default values
      const userEmail = req.headers['x-user-email'] as string || 'admin@example.com'
      const userId = parseInt(req.headers['x-user-id'] as string || '1', 10)
      
      setAuditUser(req, userId, userEmail)
    } catch (error) {
      console.warn('Failed to extract user for audit:', error)
    }
  }
  
  next()
}
