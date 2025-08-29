import { z } from 'zod'

// Driver validation schema
export const driverSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters'),
  
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Please enter a valid phone number'),
  
  license_number: z.string()
    .min(1, 'License number is required')
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number must not exceed 50 characters')
    .regex(/^[A-Z0-9\-\s]+$/i, 'License number can only contain letters, numbers, hyphens, and spaces'),
  
  status: z.enum(['Active', 'Inactive', 'On Holiday']),
  
  employment_type: z.enum(['Fulltime', 'Minijob']),
  
  annual_vacation_days: z.number()
    .min(0, 'Annual vacation days cannot be negative')
    .max(365, 'Annual vacation days cannot exceed 365')
    .int('Annual vacation days must be a whole number'),
  
  join_date: z.string()
    .min(1, 'Join date is required')
    .refine((date: string) => {
      const parsedDate = new Date(date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      return !isNaN(parsedDate.getTime()) && parsedDate <= today
    }, 'Join date cannot be in the future'),
  
  current_address: z.string()
    .max(500, 'Address must not exceed 500 characters')
    .optional(),
  
  profile_picture: z.string().optional()
})

// Warning validation schema
export const warningSchema = z.object({
  driver_id: z.number()
    .min(1, 'Please select a driver'),
  
  category_id: z.number()
    .min(1, 'Please select a category')
    .optional(),
  
  type: z.string()
    .min(1, 'Warning type is required')
    .max(100, 'Warning type must not exceed 100 characters'),
  
  description: z.string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  
  severity: z.enum(['Low', 'Medium', 'High']),
  
  status: z.enum(['Active', 'Under Review', 'Resolved']),
  
  location: z.string()
    .max(200, 'Location must not exceed 200 characters')
    .optional(),
  
  date: z.string()
    .min(1, 'Warning date is required')
    .refine((date: string) => {
      const parsedDate = new Date(date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      return !isNaN(parsedDate.getTime()) && parsedDate <= today
    }, 'Warning date cannot be in the future'),
  
  expiration_date: z.string()
    .optional()
    .refine((date: string | undefined) => {
      if (!date) return true
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime())
    }, 'Please enter a valid expiration date')
})

// Holiday request validation schema
export const holidayRequestSchema = z.object({
  driverName: z.string()
    .min(1, 'Driver name is required')
    .min(2, 'Driver name must be at least 2 characters')
    .max(100, 'Driver name must not exceed 100 characters'),
  
  driverId: z.string()
    .min(1, 'Driver ID is required')
    .max(50, 'Driver ID must not exceed 50 characters'),
  
  department: z.string()
    .max(100, 'Department must not exceed 100 characters')
    .optional(),
  
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine((date: string) => {
      const parsedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start of today
      return !isNaN(parsedDate.getTime()) && parsedDate >= today
    }, 'Start date cannot be in the past'),
  
  endDate: z.string()
    .min(1, 'End date is required')
    .refine((date: string) => {
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime())
    }, 'Please enter a valid end date'),
  
  reason: z.string()
    .min(1, 'Reason is required')
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason must not exceed 500 characters'),
  
  emergencyContact: z.string()
    .max(100, 'Emergency contact must not exceed 100 characters')
    .optional(),
  
  emergencyPhone: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  
  notes: z.string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
}).refine((data: any) => {
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  return endDate >= startDate
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate']
}).refine((data: any) => {
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays <= 365
}, {
  message: 'Holiday request cannot exceed 365 days',
  path: ['endDate']
})

// Common validation utilities
export const validateFile = (file: File, options: {
  maxSize?: number
  allowedTypes?: string[]
}) => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options
  
  if (file.size > maxSize) {
    return `File size must be less than ${maxSize / (1024 * 1024)}MB`
  }
  
  if (!allowedTypes.includes(file.type)) {
    return `Only ${allowedTypes.map(type => type.split('/')[1]).join(', ')} files are allowed`
  }
  
  return null
}

export const validateDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Please enter valid dates'
  }
  
  if (end < start) {
    return 'End date must be after start date'
  }
  
  return null
}

// Export types
export type DriverFormData = z.infer<typeof driverSchema>
export type WarningFormData = z.infer<typeof warningSchema>
export type HolidayRequestFormData = z.infer<typeof holidayRequestSchema>
