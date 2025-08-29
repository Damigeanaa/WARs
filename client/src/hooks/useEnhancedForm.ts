import { useForm, UseFormProps, UseFormReturn, FieldValues, Path, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodSchema } from 'zod'
import { useState } from 'react'
import { parseApiError, ValidationError, extractValidationErrors } from '../lib/error-handling'

export interface UseEnhancedFormOptions<T extends FieldValues> extends UseFormProps<T> {
  schema?: ZodSchema<T>
  onSubmit: (data: T) => Promise<void> | void
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
  enableAutoSave?: boolean
  autoSaveDelay?: number
}

export interface EnhancedFormReturn<T extends FieldValues> extends Omit<UseFormReturn<T>, 'handleSubmit'> {
  isSubmitting: boolean
  submitError: string | null
  validationErrors: ValidationError[]
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  handleFormSubmit: (onValid: SubmitHandler<T>, onInvalid?: (errors: any) => void) => (e?: React.BaseSyntheticEvent) => Promise<void>
  clearErrors: () => void
  setFieldError: (field: Path<T>, message: string) => void
  getFieldError: (field: Path<T>) => string | undefined
}

export function useEnhancedForm<T extends FieldValues>({
  schema,
  onSubmit,
  onSuccess,
  onError,
  enableAutoSave = false,
  autoSaveDelay = 1000,
  ...formOptions
}: UseEnhancedFormOptions<T>): EnhancedFormReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  const form = useForm<T>({
    ...formOptions,
    resolver: schema ? zodResolver(schema as any) : undefined,
  })

  const clearErrors = () => {
    setSubmitError(null)
    setValidationErrors([])
    form.clearErrors()
  }

  const setFieldError = (field: Path<T>, message: string) => {
    form.setError(field, { type: 'manual', message })
  }

  const getFieldError = (field: Path<T>): string | undefined => {
    const formError = form.formState.errors[field]
    if (formError && typeof formError.message === 'string') {
      return formError.message
    }

    const validationError = validationErrors.find(err => err.field === field)
    return validationError?.message
  }

  const handleFormSubmit = (onValid: SubmitHandler<T>, onInvalid?: (errors: any) => void) => {
    return form.handleSubmit(onValid, onInvalid)
  }

  const handleSubmit = async (e?: React.BaseSyntheticEvent) => {
    e?.preventDefault()
    
    if (isSubmitting) return

    clearErrors()
    setIsSubmitting(true)

    try {
      // Get form data and validate
      const isValid = await form.trigger()
      
      if (!isValid) {
        setIsSubmitting(false)
        return
      }

      const data = form.getValues()

      // Additional schema validation if provided
      if (schema) {
        const result = schema.safeParse(data)
        if (!result.success) {
          const errors = extractValidationErrors(result.error)
          setValidationErrors(errors)
          
          // Set form errors
          errors.forEach((error: ValidationError) => {
            form.setError(error.field as Path<T>, {
              type: 'manual',
              message: error.message
            })
          })
          
          setIsSubmitting(false)
          return
        }
      }

      // Submit the form
      await onSubmit(data)
      
      // Success callback
      onSuccess?.(data)
      
      // Reset form on successful submission
      form.reset(data)
      
    } catch (error) {
      const apiError = parseApiError(error)
      setSubmitError(apiError.error)
      
      // Extract and set field-specific validation errors
      const fieldErrors = extractValidationErrors(error)
      setValidationErrors(fieldErrors)
      
      fieldErrors.forEach((fieldError: ValidationError) => {
        form.setError(fieldError.field as Path<T>, {
          type: 'manual',
          message: fieldError.message
        })
      })
      
      // Error callback
      onError?.(error)
      
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-save functionality (optional)
  // This could be implemented with useEffect and watch
  // For now, keeping it simple

  return {
    ...form,
    isSubmitting,
    submitError,
    validationErrors,
    handleSubmit,
    handleFormSubmit,
    clearErrors,
    setFieldError,
    getFieldError,
  }
}

// Helper hook for field-level validation
export function useFieldValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>
) {
  const fieldState = form.getFieldState(fieldName, form.formState)
  
  return {
    hasError: !!fieldState.error,
    error: fieldState.error?.message,
    isDirty: fieldState.isDirty,
    isTouched: fieldState.isTouched,
    isValidating: fieldState.isValidating,
  }
}

// Utility for creating form field props
export function createFieldProps<T extends FieldValues>(
  form: EnhancedFormReturn<T>,
  fieldName: Path<T>,
  options?: {
    required?: boolean
    placeholder?: string
    disabled?: boolean
  }
) {
  const register = form.register(fieldName, {
    required: options?.required ? `${String(fieldName)} is required` : false,
  })
  
  return {
    ...register,
    placeholder: options?.placeholder,
    disabled: options?.disabled || form.isSubmitting,
    error: form.getFieldError(fieldName),
    'aria-invalid': !!form.getFieldError(fieldName),
    'aria-describedby': form.getFieldError(fieldName) ? `${String(fieldName)}-error` : undefined,
  }
}
