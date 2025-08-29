import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  className?: string
  children?: React.ReactNode
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, required, className, children }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <Label className={cn(
          "text-sm font-medium",
          error && "text-red-500",
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}>
          {label}
        </Label>
        {children}
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  required?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, required, className, ...props }, ref) => {
    return (
      <FormField label={label} error={error} required={required}>
        <Input
          ref={ref}
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
      </FormField>
    )
  }
)

FormInput.displayName = "FormInput"

interface FormSelectProps {
  label: string
  error?: string
  required?: boolean
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
}

export const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
  ({ label, error, required, value, onValueChange, placeholder, children, className }, ref) => {
    return (
      <FormField label={label} error={error} required={required}>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger
            ref={ref}
            className={cn(
              error && "border-red-500 focus:ring-red-500",
              className
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {children}
          </SelectContent>
        </Select>
      </FormField>
    )
  }
)

FormSelect.displayName = "FormSelect"

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  required?: boolean
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, required, className, ...props }, ref) => {
    return (
      <FormField label={label} error={error} required={required}>
        <Textarea
          ref={ref}
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
      </FormField>
    )
  }
)

FormTextarea.displayName = "FormTextarea"
