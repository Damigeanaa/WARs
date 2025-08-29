import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/contexts/NotificationContext'
import { format as formatDate } from 'date-fns'
import { API_ENDPOINTS } from '@/config/api'
import { 
  Calendar,
  Send,
  CheckCircle,
  Truck,
  ArrowLeft,
  AlertCircle,
  User,
  CalendarDays,
  Clock,
  Shield
} from 'lucide-react'

interface HolidayRequest {
  driverName: string
  driverId: string
  startDate: string
  endDate: string
  reason: string
}

export default function HolidayRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [validationError, setValidationError] = useState('')
  const { createNotification } = useNotifications()
  const [formData, setFormData] = useState<HolidayRequest>({
    driverName: '',
    driverId: '',
    startDate: '',
    endDate: '',
    reason: ''
  })

  const handleInputChange = (field: keyof HolidayRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('')
    }
  }

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays
    }
    return 0
  }

  const validateDriverId = async (driverId: string) => {
    try {
      // Validate format: should be 14 characters alphanumeric (like A2WPZ6D898ABGH)
      const formatRegex = /^[A-Z0-9]{14}$/
      if (!formatRegex.test(driverId)) {
        return false
      }
      
      const response = await fetch(API_ENDPOINTS.driverById(driverId))
      return response.ok
    } catch (error) {
      console.error('Error validating driver ID:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setValidationError('')

    try {
      // Validate driver ID exists in database
      const isValidDriver = await validateDriverId(formData.driverId)
      if (!isValidDriver) {
        setValidationError('Invalid driver ID format or driver not found. Please enter a valid 14-character driver ID (e.g., A2WPZ6D898ABGH).')
        setIsSubmitting(false)
        return
      }

      const response = await fetch(API_ENDPOINTS.publicHolidayRequests, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          requestedDays: calculateDays(),
          status: 'pending',
          submittedAt: new Date().toISOString()
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Create notification for the holiday request
        await createNotification({
          type: 'holiday_request_submitted',
          title: 'New Holiday Request Submitted',
          message: `${formData.driverName} has submitted a holiday request for ${calculateDays()} days from ${formatDate(new Date(formData.startDate), 'MMM dd')} to ${formatDate(new Date(formData.endDate), 'MMM dd, yyyy')}`,
          icon: 'Calendar',
          severity: 'info',
          action_url: '/holidays',
          action_label: 'Review Request',
          metadata: {
            request_id: result.requestId,
            driver_name: formData.driverName,
            driver_id: formData.driverId,
            start_date: formData.startDate,
            end_date: formData.endDate,
            days: calculateDays()
          }
        })
        
        setIsSubmitted(true)
      } else {
        const errorData = await response.json()
        setValidationError(errorData.message || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Error submitting holiday request:', error)
      setValidationError('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return formData.driverName && 
           formData.driverId && 
           formData.startDate && 
           formData.endDate && 
           formData.reason &&
           new Date(formData.endDate) >= new Date(formData.startDate)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        {/* Modern Header */}
        <nav className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Holiday Request
                </span>
                <div className="text-xs text-slate-500 font-medium">Request Submitted</div>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="border-2 border-slate-300 hover:border-emerald-300 hover:bg-emerald-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto">
            {/* Success Hero */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">Request Submitted Successfully!</h1>
              <p className="text-lg text-slate-600">
                Your holiday request has been received and is now being processed.
              </p>
            </div>

            {/* Request Details Card */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 mb-8">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-emerald-600" />
                  </div>
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-600">Driver Information</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Name:</span>
                          <span className="font-semibold text-slate-900">{formData.driverName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">ID:</span>
                          <span className="font-mono text-sm bg-slate-200 px-2 py-1 rounded">{formData.driverId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Holiday Period</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-emerald-700">Duration:</span>
                          <span className="font-semibold text-emerald-900">{calculateDays()} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-700">Dates:</span>
                          <span className="font-semibold text-emerald-900 text-sm">
                            {formatDate(new Date(formData.startDate), 'MMM dd')} - {formatDate(new Date(formData.endDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Next Steps */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-blue-900">Current Status</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Pending Review
                    </Badge>
                  </div>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Your request is in the approval queue. You'll receive a notification once it's reviewed. 
                    Typical processing time is 1-2 business days.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 px-8"
                size="lg"
              >
                Return Home
              </Button>
              <Button 
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="border-2 border-slate-300 hover:border-emerald-300 hover:bg-emerald-50 px-8"
                size="lg"
              >
                Submit Another Request
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Modern Header */}
      <nav className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Holiday Request
              </span>
              <div className="text-xs text-slate-500 font-medium">Submit Time Off Request</div>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="border-2 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-2 mb-8">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">Holiday Request Portal</span>
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Secure</Badge>
            </div>
            
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Submit Holiday Request
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Submit your time off request with secure driver verification and instant processing.
            </p>
          </div>

          {/* Main Form Card */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                Request Details
              </CardTitle>
              <p className="text-slate-600 mt-2">
                Please fill out all required fields to submit your holiday request.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Driver Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 pb-2 border-b border-slate-200">
                    <Shield className="h-4 w-4" />
                    Driver Verification
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="driverId" className="text-slate-700 font-medium">Driver ID *</Label>
                      <Input
                        id="driverId"
                        type="text"
                        value={formData.driverId}
                        onChange={(e) => handleInputChange('driverId', e.target.value.toUpperCase())}
                        placeholder="A2WPZ6D898ABGH"
                        maxLength={14}
                        required
                        className="h-12 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-slate-500">
                        Enter your 14-character driver ID (letters and numbers only)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="driverName" className="text-slate-700 font-medium">Full Name *</Label>
                      <Input
                        id="driverName"
                        type="text"
                        value={formData.driverName}
                        onChange={(e) => handleInputChange('driverName', e.target.value)}
                        placeholder="Enter your full name"
                        required
                        className="h-12 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Holiday Dates Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 pb-2 border-b border-slate-200">
                    <CalendarDays className="h-4 w-4" />
                    Holiday Period
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-slate-700 font-medium">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="h-12 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-slate-700 font-medium">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        required
                        className="h-12 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {formData.startDate && formData.endDate && (
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                      <div className="flex items-center gap-2 text-indigo-700">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          Total days requested: <strong>{calculateDays()}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reason Section */}
                <div className="space-y-4">
                  <Label htmlFor="reason" className="text-slate-700 font-medium">Reason for Request *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder="Please provide a reason for your holiday request (e.g., family vacation, personal time, medical appointment)"
                    required
                    rows={4}
                    className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Error Message */}
                {validationError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{validationError}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={!isFormValid() || isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 h-14 text-lg"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing Request...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Submit Holiday Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Shield className="h-4 w-4" />
              <span>
                Your information is securely encrypted and validated against our driver database.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
