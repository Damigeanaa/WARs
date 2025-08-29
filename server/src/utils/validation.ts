import { z, ZodError, ZodSchema } from 'zod'
import { Request, Response, NextFunction } from 'express'

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ApiErrorResponse {
  error: string
  details?: ValidationError[]
  status: number
  timestamp: string
  path: string
}

export class AppError extends Error {
  public status: number
  public details?: any
  public code?: string

  constructor(message: string, status: number = 500, details?: any, code?: string) {
    super(message)
    this.status = status
    this.details = details
    this.code = code
    this.name = 'AppError'
  }
}

export const createValidationError = (message: string, details?: ValidationError[]): AppError => {
  return new AppError(message, 400, details, 'VALIDATION_ERROR')
}

export const createNotFoundError = (resource: string, id?: string): AppError => {
  const message = id ? `${resource} with id ${id} not found` : `${resource} not found`
  return new AppError(message, 404, null, 'NOT_FOUND')
}

export const createConflictError = (message: string, details?: any): AppError => {
  return new AppError(message, 409, details, 'CONFLICT')
}

export const createUnauthorizedError = (message: string = 'Unauthorized'): AppError => {
  return new AppError(message, 401, null, 'UNAUTHORIZED')
}

export const createForbiddenError = (message: string = 'Forbidden'): AppError => {
  return new AppError(message, 403, null, 'FORBIDDEN')
}

export const createInternalError = (message: string = 'Internal server error', details?: any): AppError => {
  return new AppError(message, 500, details, 'INTERNAL_ERROR')
}

// Convert Zod errors to our ValidationError format
export const formatZodError = (error: ZodError): ValidationError[] => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }))
}

// Validation middleware factory
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body)
      
      if (!result.success) {
        const validationErrors = formatZodError(result.error)
        throw createValidationError('Validation failed', validationErrors)
      }
      
      // Replace req.body with validated data
      req.body = result.data
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Query parameter validation
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query)
      
      if (!result.success) {
        const validationErrors = formatZodError(result.error)
        throw createValidationError('Query validation failed', validationErrors)
      }
      
      req.query = result.data as any
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Route parameter validation
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params)
      
      if (!result.success) {
        const validationErrors = formatZodError(result.error)
        throw createValidationError('Parameter validation failed', validationErrors)
      }
      
      req.params = result.data
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Global error handler middleware
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  })

  let apiError: ApiErrorResponse

  if (error instanceof AppError) {
    apiError = {
      error: error.message,
      details: error.details,
      status: error.status,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  } else if (error instanceof ZodError) {
    const validationErrors = formatZodError(error)
    apiError = {
      error: 'Validation failed',
      details: validationErrors,
      status: 400,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  } else if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    apiError = {
      error: 'A record with this information already exists',
      status: 409,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  } else if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    apiError = {
      error: 'Referenced record does not exist',
      status: 400,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  } else {
    // Generic error
    apiError = {
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      status: 500,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  }

  res.status(apiError.status).json(apiError)
}

// Async wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Common validation schemas
export const commonSchemas = {
  id: z.object({
    id: z.string().min(1, 'ID is required')
  }),
  
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc')
  }),
  
  dateRange: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional()
  }).refine(data => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date)
    }
    return true
  }, {
    message: 'Start date must be before end date'
  })
}

// Database constraint helpers
export const checkUniqueConstraint = async (
  checkFn: () => Promise<any>,
  message: string
) => {
  const existing = await checkFn()
  if (existing) {
    throw createConflictError(message)
  }
}

export const checkExists = async (
  checkFn: () => Promise<any>,
  resourceName: string,
  id?: string
) => {
  const record = await checkFn()
  if (!record) {
    throw createNotFoundError(resourceName, id)
  }
  return record
}

// Response helpers
export const successResponse = (data: any, message?: string) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }
}

export const paginatedResponse = (data: any[], pagination: any, total: number) => {
  return {
    success: true,
    data,
    pagination: {
      ...pagination,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  }
}
