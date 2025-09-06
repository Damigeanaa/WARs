import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { useNotifications } from '@/contexts/NotificationContext'
import { useLanguage } from '@/contexts/LanguageContext'
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
  Shield,
  Globe
} from 'lucide-react'

interface HolidayRequest {
  driverName: string
  driverId: string
  startDate: string
  endDate: string
  reason: string
}

interface DriverVacationInfo {
  name: string
  annual_vacation_days: number
  used_vacation_days: number
  remaining_days: number
}

export default function HolidayRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [validationError, setValidationError] = useState('')
  const { createNotification } = useNotifications()
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage()
  const { t } = useTranslation()
  const [formData, setFormData] = useState<HolidayRequest>({
    driverName: '',
    driverId: '',
    startDate: '',
    endDate: '',
    reason: ''
  })
  const [driverVacationInfo, setDriverVacationInfo] = useState<DriverVacationInfo | null>(null)

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

  const isRequestExceedingLimit = () => {
    if (!driverVacationInfo) return false
    const requestedDays = calculateDays()
    return requestedDays > driverVacationInfo.remaining_days
  }

  const getVacationWarningType = () => {
    if (!driverVacationInfo) return null
    const requestedDays = calculateDays()
    const remainingDays = driverVacationInfo.remaining_days
    
    if (remainingDays === 0) return 'no_days'
    if (requestedDays > remainingDays) return 'exceeds_limit'
    return null
  }

  const validateDriverId = async (driverId: string) => {
    try {
      // Validate format: should be 13-14 characters alphanumeric (like A97ONL7W6Y5CS or A2WPZ6D898ABGH)
      const formatRegex = /^[A-Z0-9]{13,14}$/
      if (!formatRegex.test(driverId)) {
        return false
      }
      
      const response = await fetch(API_ENDPOINTS.driverById(driverId))
      if (response.ok) {
        const driver = await response.json()
        // Auto-fill the driver name when driver ID is validated
        setFormData(prev => ({ ...prev, driverName: driver.name }))
        
        // Store vacation information
        setDriverVacationInfo({
          name: driver.name,
          annual_vacation_days: driver.annual_vacation_days || 25,
          used_vacation_days: driver.used_vacation_days || 0,
          remaining_days: (driver.annual_vacation_days || 25) - (driver.used_vacation_days || 0)
        })
        
        return true
      }
      // Clear vacation info if validation fails
      setDriverVacationInfo(null)
      return false
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
        setValidationError(t('holidayRequest.invalidDriverId'))
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
        setValidationError(errorData.message || t('holidayRequest.submitFailed'))
      }
    } catch (error) {
      console.error('Error submitting holiday request:', error)
      setValidationError(t('holidayRequest.submitFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return formData.driverId && 
           formData.startDate && 
           formData.endDate && 
           formData.reason &&
           new Date(formData.endDate) >= new Date(formData.startDate)
  }

  const handleDriverIdChange = async (driverId: string) => {
    // Update the driver ID
    setFormData(prev => ({ ...prev, driverId: driverId.toUpperCase() }))
    
    // Clear driver name and vacation info if ID is invalid length
    if (driverId.length < 13 || driverId.length > 14) {
      setFormData(prev => ({ ...prev, driverName: '' }))
      setDriverVacationInfo(null)
      return
    }
    
    // Validate and auto-fill driver name if valid
    if (driverId.length >= 13) {
      await validateDriverId(driverId)
    }
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
                  {t('holidayRequest.title')}
                </span>
                <div className="text-xs text-slate-500 font-medium">{t('holidayRequest.success.title')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    {t('homepage.languageSwitcher')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {availableLanguages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={currentLanguage === lang.code ? 'bg-slate-100' : ''}
                    >
                      {lang.nativeName}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="border-2 border-slate-300 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('holidayRequest.backToHome')}
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto">
            {/* Success Hero */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{t('holidayRequest.success.title')}</h1>
              <p className="text-lg text-slate-600">
                {t('holidayRequest.success.subtitle')}
              </p>
            </div>

            {/* Request Details Card */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 mb-8">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-emerald-600" />
                  </div>
                  {t('holidayRequest.success.requestDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-600">{t('holidayRequest.success.driverInformation')}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">{t('holidayRequest.success.name')}</span>
                          <span className="font-semibold text-slate-900">{formData.driverName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">{t('holidayRequest.success.id')}</span>
                          <span className="font-mono text-sm bg-slate-200 px-2 py-1 rounded">{formData.driverId}</span>
                        </div>
                        {driverVacationInfo && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">{t('holidayRequest.success.remainingDays')}</span>
                            <span className="font-semibold text-blue-700">{driverVacationInfo.remaining_days - calculateDays()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">{t('holidayRequest.holidayPeriod')}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-emerald-700">{t('holidayRequest.success.duration')}</span>
                          <span className="font-semibold text-emerald-900">{calculateDays()} {t('holidayRequest.success.days')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-700">{t('holidayRequest.success.dates')}</span>
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
                      <span className="font-semibold text-blue-900">{t('holidayRequest.success.currentStatus')}</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      {t('holidayRequest.success.pendingReview')}
                    </Badge>
                  </div>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    {t('holidayRequest.success.statusDescription')}
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
                {t('holidayRequest.success.returnHome')}
              </Button>
              <Button 
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="border-2 border-slate-300 hover:border-emerald-300 hover:bg-emerald-50 px-8"
                size="lg"
              >
                {t('holidayRequest.success.submitAnother')}
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
                {t('holidayRequest.title')}
              </span>
              <div className="text-xs text-slate-500 font-medium">{t('holidayRequest.submitTimeOff')}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  {t('homepage.languageSwitcher')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={currentLanguage === lang.code ? 'bg-slate-100' : ''}
                  >
                    {lang.nativeName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="border-2 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('holidayRequest.backToHome')}
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-2 mb-8">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">{t('holidayRequest.portalBadge')}</span>
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{t('holidayRequest.secureBadge')}</Badge>
            </div>
            
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {t('holidayRequest.submitTitle')}
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              {t('holidayRequest.subtitle')}
            </p>
          </div>

          {/* Main Form Card */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                {t('holidayRequest.success.requestDetails')}
              </CardTitle>
              <p className="text-slate-600 mt-2">
                {t('holidayRequest.fillRequired')}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Driver Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 pb-2 border-b border-slate-200">
                    <Shield className="h-4 w-4" />
                    {t('holidayRequest.driverVerification')}
                  </div>
                  
                  <div className="grid md:grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="driverId" className="text-slate-700 font-medium">{t('holidayRequest.driverId')} *</Label>
                      <Input
                        id="driverId"
                        type="text"
                        value={formData.driverId}
                        onChange={(e) => handleDriverIdChange(e.target.value)}
                        placeholder={t('holidayRequest.driverIdPlaceholder')}
                        maxLength={14}
                        required
                        className="h-12 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-slate-500">
                        {t('holidayRequest.driverIdHelp')}
                      </p>
                      {driverVacationInfo && (
                        <div className={`mt-2 p-3 rounded-md ${
                          driverVacationInfo.remaining_days === 0 
                            ? 'bg-red-50 border border-red-200' 
                            : 'bg-green-50 border border-green-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <User className={`h-4 w-4 ${
                              driverVacationInfo.remaining_days === 0 ? 'text-red-600' : 'text-green-600'
                            }`} />
                            <span className={`font-medium ${
                              driverVacationInfo.remaining_days === 0 ? 'text-red-700' : 'text-green-700'
                            }`}>{t('holidayRequest.driverVerified')}</span> 
                            <span className={
                              driverVacationInfo.remaining_days === 0 ? 'text-red-700' : 'text-green-700'
                            }>{driverVacationInfo.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className={`h-4 w-4 ${
                                driverVacationInfo.remaining_days === 0 ? 'text-red-600' : 'text-blue-600'
                              }`} />
                              <span className="text-slate-600">{t('holidayRequest.remainingDays')}</span>
                              <span className={`font-semibold ${
                                driverVacationInfo.remaining_days === 0 ? 'text-red-700' : 'text-blue-700'
                              }`}>{driverVacationInfo.remaining_days}</span>
                            </div>
                            <div className="text-slate-500">
                              ({driverVacationInfo.used_vacation_days}/{driverVacationInfo.annual_vacation_days} {t('holidayRequest.daysUsed')})
                            </div>
                          </div>
                          {driverVacationInfo.remaining_days === 0 && (
                            <div className="mt-2 text-xs text-red-600">
                              ⚠️ No vacation days remaining this year
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Holiday Dates Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 pb-2 border-b border-slate-200">
                    <CalendarDays className="h-4 w-4" />
                    {t('holidayRequest.holidayPeriod')}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-slate-700 font-medium">{t('holidayRequest.startDate')} *</Label>
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
                      <Label htmlFor="endDate" className="text-slate-700 font-medium">{t('holidayRequest.endDate')} *</Label>
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
                    <div className="space-y-2">
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                        <div className="flex items-center gap-2 text-indigo-700">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">
                            {t('holidayRequest.totalDays', { count: calculateDays() })}
                          </span>
                        </div>
                      </div>
                      
                      {(() => {
                        const warningType = getVacationWarningType()
                        
                        if (warningType === 'no_days') {
                          return (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                              <div className="flex items-center gap-2 text-red-700 mb-2">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">No vacation days available</span>
                              </div>
                              <p className="text-sm text-red-600">
                                {t('holidayRequest.noDaysLeft')}
                              </p>
                            </div>
                          )
                        }
                        
                        if (warningType === 'exceeds_limit') {
                          return (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                              <div className="flex items-center gap-2 text-amber-700 mb-2">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">Exceeds available days</span>
                              </div>
                              <p className="text-sm text-amber-600 mb-2">
                                {t('holidayRequest.exceedsLimit', { 
                                  requested: calculateDays(), 
                                  remaining: driverVacationInfo?.remaining_days 
                                })}
                              </p>
                              <p className="text-sm text-amber-700 font-medium">
                                {t('holidayRequest.maxCanRequest', { 
                                  maxDays: driverVacationInfo?.remaining_days 
                                })}
                              </p>
                            </div>
                          )
                        }
                        
                        if (driverVacationInfo && calculateDays() > 0) {
                          return (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">
                                  {t('holidayRequest.vacationConfirm', { 
                                    remaining: driverVacationInfo.remaining_days - calculateDays() 
                                  })}
                                </span>
                              </div>
                            </div>
                          )
                        }
                        
                        return null
                      })()}
                    </div>
                  )}
                </div>

                {/* Reason Section */}
                <div className="space-y-4">
                  <Label htmlFor="reason" className="text-slate-700 font-medium">{t('holidayRequest.reasonTitle')} *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder={t('holidayRequest.reasonPlaceholder')}
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
                    disabled={!isFormValid() || isSubmitting || (driverVacationInfo?.remaining_days === 0) || isRequestExceedingLimit()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 h-14 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('holidayRequest.processingRequest')}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        {t('holidayRequest.submitRequest')}
                      </>
                    )}
                  </Button>
                  
                  {/* Submit Button Help Text */}
                  {driverVacationInfo?.remaining_days === 0 && (
                    <p className="text-center text-sm text-red-600 mt-2">
                      {t('holidayRequest.submitDisabledNoDays')}
                    </p>
                  )}
                  {isRequestExceedingLimit() && driverVacationInfo && driverVacationInfo.remaining_days > 0 && (
                    <p className="text-center text-sm text-amber-600 mt-2">
                      {t('holidayRequest.submitDisabledExceeds')}
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Shield className="h-4 w-4" />
              <span>
                {t('holidayRequest.securityNotice')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
