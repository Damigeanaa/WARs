import { ZodError } from 'zod'

export interface ApiError {
  error: string
  details?: any
  status?: number
}

export interface ValidationError {
  field: string
  message: string
}

export class AppError extends Error {
  public status: number
  public details?: any

  constructor(message: string, status: number = 500, details?: any) {
    super(message)
    this.status = status
    this.details = details
    this.name = 'AppError'
  }
}

export const parseApiError = (error: any): ApiError => {
  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      error: 'Network error. Please check your connection.',
      status: 0
    }
  }

  // Handle our custom AppError
  if (error instanceof AppError) {
    return {
      error: error.message,
      status: error.status,
      details: error.details
    }
  }

  // Handle API response errors
  if (error.response) {
    const status = error.response.status
    let message = 'An error occurred'

    try {
      const data = error.response.data || error.response
      if (typeof data === 'string') {
        message = data
      } else if (data.error) {
        message = data.error
      } else if (data.message) {
        message = data.message
      }

      return {
        error: message,
        status,
        details: data.details
      }
    } catch {
      return {
        error: `HTTP Error ${status}`,
        status
      }
    }
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      error: 'Validation failed',
      details: error.issues,
      status: 400
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      error,
      status: 500
    }
  }

  // Fallback for unknown error types
  return {
    error: 'An unexpected error occurred',
    status: 500,
    details: error
  }
}

export const extractValidationErrors = (error: any): ValidationError[] => {
  const apiError = parseApiError(error)
  
  if (apiError.details && Array.isArray(apiError.details)) {
    return apiError.details.map((detail: any) => ({
      field: detail.path ? detail.path.join('.') : 'unknown',
      message: detail.message || 'Invalid value'
    }))
  }

  return []
}

export const getFieldError = (errors: ValidationError[], fieldName: string): string | undefined => {
  const error = errors.find(err => err.field === fieldName)
  return error?.message
}

export const createApiErrorHandler = (showToast: (options: { title: string; description: string; variant?: 'default' | 'destructive' }) => void) => {
  return (error: any, fallbackMessage?: string) => {
    const apiError = parseApiError(error)
    
    showToast({
      title: 'Error',
      description: fallbackMessage || apiError.error,
      variant: 'destructive'
    })

    // Log detailed error for debugging
    console.error('API Error:', {
      message: apiError.error,
      status: apiError.status,
      details: apiError.details,
      originalError: error
    })
  }
}

export const retryableErrors = [0, 500, 502, 503, 504] // Network errors and server errors

export const isRetryableError = (error: any): boolean => {
  const apiError = parseApiError(error)
  return retryableErrors.includes(apiError.status || 500)
}

export const formatErrorMessage = (error: any, context?: string): string => {
  const apiError = parseApiError(error)
  
  if (context) {
    return `${context}: ${apiError.error}`
  }
  
  return apiError.error
}

// Enhanced error boundary error handler
export const logError = (error: Error, errorInfo?: any) => {
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    errorInfo,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  })

  // In a real application, you would send this to an error reporting service
  // like Sentry, LogRocket, etc.
}
