import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { API_ENDPOINTS } from '@/config/api'
import { 
  Calendar, 
  Check,
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  User,
  CalendarDays,
  Users2,
  Truck,
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  Upload,
  Settings,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkPattern {
  type: 'monday-friday' | 'mixed-tours' | 'specific-tour-only' | 'monday-friday-mixed' | 'custom'
  workDays?: string[] // ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  allowedTours?: string[] // Specific tour names this driver can work
  nextDayCount?: number // For mixed-tours: how many next day tours per week
  sameDayCount?: number // For mixed-tours: how many same day tours per week
  preferredTour?: string // For specific-tour-only: the main tour they work
}

interface Driver {
  id: number
  name: string
  driver_id: string
  van_license_plate?: string
  status: 'Active' | 'Inactive' | 'On Holiday'
  employment_type: 'Fulltime' | 'Minijob'
  workPattern?: WorkPattern
}

interface WorkingTour {
  id: number
  name: string
  color: string
  is_active: number
}

interface ScheduleEntry {
  driverId: number
  date: string
  status: 'available' | 'scheduled' | 'holiday' | 'sick' | 'unavailable'
  tourAssigned?: string
  notes?: string
}

interface WeekDay {
  date: Date
  dayName: string
  shortDate: string
  isToday: boolean
  isWeekend: boolean
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'available':
      return <Check className="h-5 w-5 text-emerald-600" />
    case 'scheduled':
      return <Check className="h-5 w-5 text-blue-600" />
    case 'holiday':
      return <Calendar className="h-5 w-5 text-amber-600" />
    case 'sick':
      return <AlertTriangle className="h-5 w-5 text-rose-600" />
    case 'unavailable':
      return <X className="h-5 w-5 text-slate-600" />
    default:
      return <Clock className="h-5 w-5 text-gray-400" />
  }
}

// Work Pattern Form Component
function WorkPatternForm({ 
  driver, 
  workingTours, 
  onSave, 
  onCancel,
  onDelete
}: {
  driver: Driver
  workingTours: WorkingTour[]
  onSave: (driverId: number, pattern: WorkPattern) => void
  onCancel: () => void
  onDelete: (driverId: number) => void
}) {
  const [pattern, setPattern] = useState<WorkPattern>(
    driver.workPattern || { type: 'monday-friday' }
  )
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    if (!pattern.type) errs.push('Type required')
    if (pattern.type === 'specific-tour-only' && !pattern.preferredTour) errs.push('Preferred tour required')
    if ((pattern.type === 'mixed-tours' || pattern.type === 'monday-friday-mixed') && (!pattern.allowedTours || pattern.allowedTours.length === 0)) errs.push('Select at least one allowed tour')
    if (pattern.type === 'custom' && (!pattern.workDays || pattern.workDays.length === 0)) errs.push('Select at least one working day')
    setErrors(errs)
    if (errs.length === 0) onSave(driver.id, pattern)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Work Pattern Type
        </label>
        <select
          value={pattern.type}
          onChange={(e) => setPattern({ type: e.target.value as any })}
          className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Work pattern type"
        >
          <option value="monday-friday">Monday to Friday (Any Tour)</option>
          <option value="monday-friday-mixed">Monday to Friday (Specific Tours)</option>
          <option value="specific-tour-only">Specific Tour Only</option>
          <option value="mixed-tours">Mixed Tours (Any Day)</option>
          <option value="custom">Custom Days</option>
        </select>
        
        {/* Helpful descriptions */}
        <div className="mt-2 text-xs text-slate-500">
          {pattern.type === 'monday-friday' && 'Driver works Monday through Friday and can be assigned to any available tour.'}
          {pattern.type === 'monday-friday-mixed' && 'Driver works Monday through Friday but only specific tours you select below.'}
          {pattern.type === 'specific-tour-only' && 'Driver only works one specific tour, any day of the week.'}
          {pattern.type === 'mixed-tours' && 'Driver can work any day but only specific tours you select below.'}
          {pattern.type === 'custom' && 'Driver works only on specific days you choose below.'}
        </div>
      </div>

      {pattern.type === 'specific-tour-only' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Preferred Tour
          </label>
          <select
            value={pattern.preferredTour || ''}
            onChange={(e) => setPattern({ ...pattern, preferredTour: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Preferred tour"
          >
            <option value="">Select Tour</option>
            {workingTours.map(tour => (
              <option key={tour.id} value={tour.name}>{tour.name}</option>
            ))}
          </select>
        </div>
      )}

      {(pattern.type === 'mixed-tours' || pattern.type === 'monday-friday-mixed') && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Allowed Tours
              {pattern.type === 'monday-friday-mixed' && (
                <span className="text-xs text-slate-500 block">This driver works Monday-Friday with these tours only</span>
              )}
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {workingTours.map(tour => (
                <label key={tour.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={pattern.allowedTours?.includes(tour.name) || false}
                    onChange={(e) => {
                      const currentTours = pattern.allowedTours || []
                      if (e.target.checked) {
                        setPattern({ 
                          ...pattern, 
                          allowedTours: [...currentTours, tour.name] 
                        })
                      } else {
                        setPattern({ 
                          ...pattern, 
                          allowedTours: currentTours.filter(t => t !== tour.name) 
                        })
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{tour.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {pattern.type === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Working Days
          </label>
          <div className="space-y-2">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
              <label key={day} className="flex items-center">
                <input
                  type="checkbox"
                  checked={pattern.workDays?.includes(day) || false}
                  onChange={(e) => {
                    const currentDays = pattern.workDays || []
                    if (e.target.checked) {
                      setPattern({ 
                        ...pattern, 
                        workDays: [...currentDays, day] 
                      })
                    } else {
                      setPattern({ 
                        ...pattern, 
                        workDays: currentDays.filter(d => d !== day) 
                      })
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm capitalize">{day}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 flex-wrap">
        <Button type="submit" className="flex-1 min-w-[110px]">Save Pattern</Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 min-w-[110px]">Cancel</Button>
        {driver.workPattern && (
          <Button type="button" variant="destructive" onClick={() => onDelete(driver.id)} className="min-w-[110px]">Reset</Button>
        )}
      </div>
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((e,i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
        </div>
      )}
    </form>
  )
}

export default function SchedulePlannerPage() {
  const [view, setView] = useState<'week' | 'month' | 'quarter'>('week')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([])
  const [workingTours, setWorkingTours] = useState<WorkingTour[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showWorkPatternModal, setShowWorkPatternModal] = useState(false)
  const [selectedDriverForPattern, setSelectedDriverForPattern] = useState<Driver | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const { toast } = useToast()

  // State for import/export functionality
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState('')
  const [importWeekOffset, setImportWeekOffset] = useState(1) // Default to next week

  // Database operation helper
  const saveScheduleToDatabase = async (entries: ScheduleEntry[], operation: string = "save") => {
    try {
      const scheduleEntries = entries.map(entry => ({
        driver_id: entry.driverId,
        schedule_date: entry.date,
        status: entry.status,
        van_assigned: entry.tourAssigned || null,
        notes: entry.notes || null
      }))

      const response = await fetch(API_ENDPOINTS.schedulesBulk, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: scheduleEntries })
      })

      if (!response.ok) {
        throw new Error(`Failed to ${operation} schedule: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error(`Error ${operation} schedule:`, error)
      toast({
        title: "Database Error",
        description: `Schedule ${operation} locally but failed to save to database. Please try again.`,
        variant: "destructive"
      })
      return false
    }
  }

  // Get week days (excluding Sunday)
  const getWeekDays = (date: Date): WeekDay[] => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    // Only create 6 days (Monday to Saturday), exclude Sunday
    for (let i = 0; i < 6; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      
      week.push({
        date: currentDate,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        shortDate: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: currentDate.toDateString() === new Date().toDateString(),
        isWeekend: currentDate.getDay() === 6 // Only Saturday is weekend now
      })
    }
    return week
  }

  const currentWeekDays = getWeekDays(currentWeek)

  // Ensure tour color dots receive their dynamic color via CSS variable (no inline style lint violation)
  useEffect(() => {
    const applyDotColors = () => {
      const dots = document.querySelectorAll<HTMLElement>('.tour-color-dot[data-color]')
      dots.forEach(dot => {
        const color = dot.getAttribute('data-color') || '#64748b'
        if (dot.style.getPropertyValue('--_dynamic-color') !== color) {
          dot.style.setProperty('--_dynamic-color', color)
        }
      })
      const badges = document.querySelectorAll<HTMLElement>('.tour-assignment-badge[data-color]')
      badges.forEach(badge => {
        const color = badge.getAttribute('data-color') || '#334155'
        if (badge.style.getPropertyValue('--_dynamic-color') !== color) {
          badge.style.setProperty('--_dynamic-color', color)
        }
      })
    }
    applyDotColors()
  }, [workingTours, scheduleData])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        const [driversRes, toursRes] = await Promise.all([
          fetch(API_ENDPOINTS.drivers),
          fetch(API_ENDPOINTS.workingTours)
        ])

        let activeDrivers: Driver[] = []
        if (driversRes.ok) {
          const driversData = await driversRes.json()
          activeDrivers = driversData.filter((d: Driver) => d.status === 'Active')

          // Batch load all existing patterns once
          let patternList: any[] = []
          try {
            const batchRes = await fetch(API_ENDPOINTS.workPatterns)
            if (batchRes.ok) patternList = await batchRes.json()
          } catch (e) {
            console.warn('Batch load work patterns failed', e)
          }
          const patternMap: Record<number, any> = {}
          patternList.forEach(p => { patternMap[p.driver_id] = p })

          activeDrivers.forEach(driver => {
            const p = patternMap[driver.id]
            if (p && p.type) {
              driver.workPattern = {
                type: p.type,
                allowedTours: Array.isArray(p.allowed_tours) ? p.allowed_tours : (p.allowed_tours ? p.allowed_tours : undefined),
                preferredTour: p.preferred_tour || undefined,
                workDays: Array.isArray(p.work_days) ? p.work_days : (p.work_days ? p.work_days : undefined)
              }
            }
          })

          setDrivers(activeDrivers)
        }

        if (toursRes.ok) {
          const toursData = await toursRes.json()
          const activeTours = toursData.filter((t: WorkingTour) => t.is_active === 1)
          setWorkingTours(activeTours)
          console.log('=== AVAILABLE WORKING TOURS ===')
          console.log('Active tours:', activeTours.map((t: WorkingTour) => t.name))
          console.log('Total active tours:', activeTours.length)
          console.log('=== END TOURS DEBUG ===')
        }

        // Load existing schedule data for the week
        try {
          const startDate = currentWeekDays[0]?.date.toISOString().split('T')[0]
          const endDate = currentWeekDays[5]?.date.toISOString().split('T')[0] // Last day is index 5 (Saturday)
          
          const scheduleRes = await fetch(`${API_ENDPOINTS.schedules}?start_date=${startDate}&end_date=${endDate}`)
          let existingSchedule: any[] = []
          
          if (scheduleRes.ok) {
            existingSchedule = await scheduleRes.json()
          }

          // Initialize schedule data for the week (Monday to Saturday only)
          const weekSchedule: ScheduleEntry[] = []
          
          currentWeekDays.forEach(day => {
            activeDrivers.forEach(driver => {
              const dateStr = day.date.toISOString().split('T')[0]
              
              // Check if there's existing data for this driver/date
              const existingEntry = existingSchedule.find(
                (entry: any) => entry.driver_id === driver.id && entry.schedule_date === dateStr
              )
              
              if (existingEntry) {
                // Use existing data
                weekSchedule.push({
                  driverId: driver.id,
                  date: dateStr,
                  status: existingEntry.status || 'available',
                  tourAssigned: existingEntry.van_assigned || undefined, // Tours are stored in van_assigned field
                  notes: existingEntry.notes || ''
                })
              } else {
                // Create default entry
                weekSchedule.push({
                  driverId: driver.id,
                  date: dateStr,
                  status: 'available',
                  tourAssigned: undefined,
                  notes: ''
                })
              }
            })
          })
          
          setScheduleData(weekSchedule)
        } catch (scheduleError) {
          // Fall back to creating default schedule
          const weekSchedule: ScheduleEntry[] = []
          
          currentWeekDays.forEach(day => {
            activeDrivers.forEach(driver => {
              weekSchedule.push({
                driverId: driver.id,
                date: day.date.toISOString().split('T')[0],
                status: 'available',
                tourAssigned: undefined,
                notes: ''
              })
            })
          })
          
          setScheduleData(weekSchedule)
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error",
          description: "Failed to load schedule data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentWeek, toast])

  // Navigation functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  // Schedule management functions
  const getScheduleEntry = (driverId: number, date: string): ScheduleEntry | undefined => {
    return scheduleData.find(entry => entry.driverId === driverId && entry.date === date)
  }

  const updateScheduleEntry = async (driverId: number, date: string, updates: Partial<ScheduleEntry>) => {
    // Update local state first for immediate UI response
    setScheduleData(prev => {
      const existing = prev.find(entry => entry.driverId === driverId && entry.date === date)
      if (existing) {
        return prev.map(entry => 
          entry.driverId === driverId && entry.date === date 
            ? { ...entry, ...updates }
            : entry
        )
      } else {
        return [...prev, {
          driverId,
          date,
          status: 'available',
          ...updates
        } as ScheduleEntry]
      }
    })

    // Save to database immediately
    try {
      await saveScheduleToDatabase([{
        driverId,
        date,
        status: updates.status || 'available',
        tourAssigned: updates.tourAssigned,
        notes: updates.notes || ''
      }], "update")
    } catch (error) {
      // Error handling is done in saveScheduleToDatabase
    }
  }

  const handleStatusClick = async (driverId: number, date: string) => {
    const currentEntry = getScheduleEntry(driverId, date)
    const statuses: Array<'available' | 'scheduled' | 'holiday' | 'sick' | 'unavailable'> = 
      ['available', 'scheduled', 'holiday', 'sick', 'unavailable']
    
    const currentIndex = statuses.indexOf(currentEntry?.status || 'available')
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]
    
    await updateScheduleEntry(driverId, date, { status: nextStatus })
  }

  const handleTourAssignment = async (driverId: number, date: string, tourName: string) => {
    await updateScheduleEntry(driverId, date, { 
      tourAssigned: tourName,
      status: 'scheduled'
    })
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'holiday':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'sick':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'unavailable':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTourColor = (tourName: string): string => {
    const tour = workingTours.find(t => t.name === tourName)
    return tour?.color || '#6B7280'
  }

  // Get week number (ISO week numbering)
  const getWeekNumber = (date: Date): number => {
    // Create a copy of the date to avoid modifying the original
    const target = new Date(date.valueOf())
    const dayNr = (date.getDay() + 6) % 7 // Make Monday = 0, Sunday = 6
    target.setDate(target.getDate() - dayNr + 3) // Set to Thursday of the same week
    const firstThursday = target.valueOf()
    target.setMonth(0, 1) // January 1st
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7) // First Thursday of the year
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000) // 604800000 = 7 * 24 * 3600 * 1000
  }

  // Save schedule data
  const saveScheduleData = async () => {
    try {
      // Transform ALL schedule data to match backend format (including 'available' entries)
      // This ensures that reset schedules are properly saved to the database
      const scheduleEntries = scheduleData
        .map(entry => {
          return {
            driver_id: entry.driverId, // Use numeric driver ID from our data
            schedule_date: entry.date,
            status: entry.status,
            van_assigned: entry.tourAssigned || null, // Tours are stored in van_assigned field
            notes: entry.notes || null
          }
        })
        .filter(entry => entry.driver_id) // Only include entries with valid driver_id

      console.log('Saving schedule entries:', scheduleEntries)

      const response = await fetch(API_ENDPOINTS.schedulesBulk, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ entries: scheduleEntries })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to save: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log('Save result:', result)

      toast({
        title: "Success",
        description: `Schedule data saved successfully! (${scheduleEntries.length} entries)`,
      })
      
    } catch (error) {
      console.error('Error saving schedule:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast({
        title: "Error",
        description: `Failed to save schedule data: ${errorMessage}`,
        variant: "destructive"
      })
    }
  }

  // Work Pattern functions
  const openWorkPatternModal = (driver: Driver) => {
    setSelectedDriverForPattern(driver)
    setShowWorkPatternModal(true)
  }

  const saveWorkPattern = async (driverId: number, pattern: WorkPattern) => {
    try {
      // Transform pattern to server schema
      const payload = {
        driver_id: driverId,
        type: pattern.type,
        work_days: pattern.workDays ? JSON.stringify(pattern.workDays) : null,
        allowed_tours: pattern.allowedTours ? JSON.stringify(pattern.allowedTours) : null,
        preferred_tour: pattern.preferredTour || null
      }

      const response = await fetch(API_ENDPOINTS.workPatterns, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to save work pattern: ${response.status}`)
      }

      // Update local state only if API call succeeds
      setDrivers(prev => prev.map(driver => 
        driver.id === driverId 
          ? { ...driver, workPattern: pattern }
          : driver
      ))
      
      setShowWorkPatternModal(false)
      setSelectedDriverForPattern(null)
      
      toast({
        title: "Success",
        description: "Driver work pattern saved successfully to database!",
      })
    } catch (error) {
      console.error('Error saving work pattern:', error)
      toast({
        title: "Error",
        description: "Failed to save work pattern. Please try again.",
        variant: "destructive"
      })
    }
  }

  const deleteWorkPattern = async (driverId: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.workPatterns}/driver/${driverId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete work pattern')
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, workPattern: undefined } : d))
      setShowWorkPatternModal(false)
      setSelectedDriverForPattern(null)
      toast({ title: 'Removed', description: 'Work pattern deleted.' })
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete work pattern', variant: 'destructive' })
    }
  }

  const canDriverWorkOnDay = (driver: Driver, dayName: string): boolean => {
    if (!driver.workPattern) return true // Default: can work any day

    // Convert short day names to full names for comparison
    const dayNameMap: {[key: string]: string} = {
      'mon': 'monday',
      'tue': 'tuesday', 
      'wed': 'wednesday',
      'thu': 'thursday',
      'fri': 'friday',
      'sat': 'saturday',
      'sun': 'sunday'
    }
    
    const fullDayName = dayNameMap[dayName.toLowerCase()] || dayName.toLowerCase()

    switch (driver.workPattern.type) {
      case 'monday-friday':
      case 'monday-friday-mixed':
        return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(fullDayName)
      case 'custom':
        return driver.workPattern.workDays?.includes(fullDayName) ?? true
      default:
        return true
    }
  }

  const canDriverWorkTour = (driver: Driver, tourName: string): boolean => {
    if (!driver.workPattern || !tourName) return true

    switch (driver.workPattern.type) {
      case 'specific-tour-only':
        return driver.workPattern.preferredTour === tourName
      case 'mixed-tours':
      case 'monday-friday-mixed':
        return driver.workPattern.allowedTours?.includes(tourName) ?? true
      default:
        return true
    }
  }

  const getDriverTourOptions = (driver: Driver): string[] => {
    if (!driver.workPattern) return workingTours.map(t => t.name)

    switch (driver.workPattern.type) {
      case 'specific-tour-only':
        return driver.workPattern.preferredTour ? [driver.workPattern.preferredTour] : []
      case 'mixed-tours':
      case 'monday-friday-mixed':
        return driver.workPattern.allowedTours ?? workingTours.map(t => t.name)
      default:
        return workingTours.map(t => t.name)
    }
  }

  // Schedule reset function
  const resetSchedule = () => {
    setShowResetConfirm(true)
  }

  const confirmResetSchedule = async () => {
    const resetSchedule: ScheduleEntry[] = []
    const activeDrivers = drivers.filter(d => d.status === 'Active')
    
    currentWeekDays.forEach(day => {
      activeDrivers.forEach(driver => {
        resetSchedule.push({
          driverId: driver.id,
          date: day.date.toISOString().split('T')[0],
          status: 'available',
          tourAssigned: undefined,
          notes: ''
        })
      })
    })
    
    // Update local state immediately
    setScheduleData(resetSchedule)
    setShowResetConfirm(false)

    // Save to database
    try {
      const scheduleEntries = resetSchedule.map(entry => ({
        driver_id: entry.driverId,
        schedule_date: entry.date,
        status: entry.status,
        van_assigned: entry.tourAssigned || null,
        notes: entry.notes || null
      }))

      const response = await fetch(API_ENDPOINTS.schedulesBulk, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: scheduleEntries })
      })

      if (!response.ok) {
        throw new Error(`Failed to save reset schedule: ${response.status}`)
      }

      toast({
        title: "Schedule Reset",
        description: "All schedule assignments have been cleared and saved to database",
      })
    } catch (error) {
      console.error('Error saving reset schedule:', error)
      toast({
        title: "Warning", 
        description: "Schedule reset locally but may not be saved to database",
        variant: "destructive"
      })
    }
  }

  // Export/Import functions
  const exportSchedule = () => {
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          weekStart: currentWeekDays[0]?.date.toISOString().split('T')[0],
          weekEnd: currentWeekDays[5]?.date.toISOString().split('T')[0],
          totalEntries: scheduleData.length,
          driversCount: drivers.length
        },
        drivers: drivers.map(driver => ({
          id: driver.id,
          name: driver.name,
          workPattern: driver.workPattern
        })),
        schedule: scheduleData.map(entry => ({
          driverId: entry.driverId,
          date: entry.date,
          status: entry.status,
          tourAssigned: entry.tourAssigned,
          notes: entry.notes
        })),
        tours: workingTours.map(tour => ({
          id: tour.id,
          name: tour.name,
          color: tour.color
        }))
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `schedule-export-${exportData.metadata.weekStart}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Complete",
        description: `Schedule exported successfully for week ${exportData.metadata.weekStart}`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export schedule data",
        variant: "destructive"
      })
    }
  }

  const getHolidayRequests = async (startDate: string, endDate: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.holidayRequests}?start_date=${startDate}&end_date=${endDate}`)
      if (response.ok) {
        const holidays = await response.json()
        return holidays.filter((h: any) => h.status === 'approved')
      }
    } catch (error) {
      console.warn('Could not fetch holiday requests:', error)
    }
    return []
  }

  const importSchedule = async () => {
    try {
      const parsedData = JSON.parse(importData)
      
      if (!parsedData.schedule || !parsedData.drivers) {
        throw new Error('Invalid schedule format')
      }

      // Calculate target week dates
      const targetWeekStart = new Date(currentWeekDays[0].date)
      targetWeekStart.setDate(targetWeekStart.getDate() + (importWeekOffset * 7))
      
      const targetWeekDays: string[] = []
      for (let i = 0; i < 6; i++) {
        const day = new Date(targetWeekStart)
        day.setDate(targetWeekStart.getDate() + i)
        targetWeekDays.push(day.toISOString().split('T')[0])
      }

      // Get approved holiday requests for target week
      const approvedHolidays = await getHolidayRequests(targetWeekDays[0], targetWeekDays[5])
      
      // Create mapping of driver holidays
      const driverHolidays = new Map()
      approvedHolidays.forEach((holiday: any) => {
        const holidayStart = new Date(holiday.start_date)
        const holidayEnd = new Date(holiday.end_date)
        
        targetWeekDays.forEach(dateStr => {
          const checkDate = new Date(dateStr)
          if (checkDate >= holidayStart && checkDate <= holidayEnd) {
            if (!driverHolidays.has(holiday.driver_id)) {
              driverHolidays.set(holiday.driver_id, [])
            }
            driverHolidays.get(holiday.driver_id).push(dateStr)
          }
        })
      })

      // Transform imported schedule to target week with holiday integration
      const newSchedule: ScheduleEntry[] = []
      
      parsedData.schedule.forEach((entry: any) => {
        const originalDate = new Date(entry.date)
        const dayOfWeek = originalDate.getDay()
        const mondayBasedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert Sunday=0 to Saturday=6
        
        if (mondayBasedIndex < 6) { // Only Monday-Saturday
          const targetDate = targetWeekDays[mondayBasedIndex]
          const driverHolidayDates = driverHolidays.get(entry.driverId) || []
          
          // Check if driver has approved holiday on this date
          const isOnHoliday = driverHolidayDates.includes(targetDate)
          
          newSchedule.push({
            driverId: entry.driverId,
            date: targetDate,
            status: isOnHoliday ? 'holiday' : entry.status,
            tourAssigned: isOnHoliday ? undefined : entry.tourAssigned,
            notes: isOnHoliday 
              ? `Holiday (imported from approved request)` 
              : `Imported: ${entry.notes || ''}`
          })
        }
      })

      // Update local state
      setScheduleData(newSchedule)
      
      // Save to database
      const saved = await saveScheduleToDatabase(newSchedule, "import")
      
      if (saved) {
        toast({
          title: "Import Complete",
          description: `Schedule imported for week starting ${targetWeekDays[0]} with ${approvedHolidays.length} holiday(s) applied`,
        })
      }
      
      setShowImportModal(false)
      setImportData('')
      
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Import Failed",
        description: "Failed to import schedule. Please check the file format.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Schedule Planner</h1>
            <p className="text-slate-600 mt-1">Manage driver schedules and tour assignments</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
              <button
                onClick={() => setView('week')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  view === 'week' 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  view === 'month' 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Month
              </button>
              <button
                onClick={() => setView('quarter')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  view === 'quarter' 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Quarter
              </button>
            </div>
            
            <Button variant="outline" size="sm" onClick={exportSchedule}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            
            <Button 
              size="sm"
              onClick={saveScheduleData}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetSchedule}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Schedule
            </Button>
          </div>
        </div>

        {/* Week View */}
        {view === 'week' && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {/* Week Navigation */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateWeek('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateWeek('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-lg font-semibold text-slate-900">
                    Week {getWeekNumber(currentWeek)} - {currentWeekDays[0]?.shortDate} to {currentWeekDays[5]?.shortDate}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users2 className="h-4 w-4" />
                  <span>{drivers.length} drivers</span>
                </div>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-48 p-3 text-left font-medium text-slate-700 border-r border-slate-200">
                      Driver
                    </th>
                    {currentWeekDays.map((day, index) => (
                      <th 
                        key={index} 
                        className={cn(
                          "w-32 p-3 text-center font-medium border-r border-slate-200",
                          day.isToday ? "bg-blue-50 text-blue-700" : "text-slate-700",
                          day.isWeekend ? "bg-slate-100" : ""
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{day.dayName}</span>
                          <span className="text-xs text-slate-500">{day.shortDate}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver, driverIndex) => (
                    <tr 
                      key={driver.id} 
                      className={cn(
                        "border-b border-slate-100",
                        driverIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                      )}
                    >
                      <td className="p-3 border-r border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div 
                              className="font-medium text-slate-900 truncate" 
                              title={driver.name}
                            >
                              {driver.name}
                            </div>
                            <div className="text-xs text-slate-500">{driver.driver_id}</div>
                            {!driver.workPattern ? (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  No Pattern Set
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs text-blue-600 mt-1">
                                {driver.workPattern.type === 'monday-friday' && 'Mon-Fri (Any Tour)'}
                                {driver.workPattern.type === 'monday-friday-mixed' && 'Mon-Fri (Specific Tours)'}
                                {driver.workPattern.type === 'specific-tour-only' && `${driver.workPattern.preferredTour}`}
                                {driver.workPattern.type === 'mixed-tours' && 'Mixed Tours (Any Day)'}
                                {driver.workPattern.type === 'custom' && 'Custom Schedule'}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => openWorkPatternModal(driver)}
                            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                            title="Configure work pattern"
                          >
                            <Settings className="h-4 w-4 text-slate-500" />
                          </button>
                        </div>
                      </td>
                      
                      {currentWeekDays.map((day, dayIndex) => {
                        const dateStr = day.date.toISOString().split('T')[0]
                        const entry = getScheduleEntry(driver.id, dateStr)
                        const canWork = canDriverWorkOnDay(driver, day.dayName)
                        
                        // Debug log for first few entries
                        if (driverIndex < 3 && dayIndex < 3) {
                          console.log(`DEBUG: Driver ${driver.name} (${driver.id}) on ${dateStr}:`, {
                            entry,
                            tourAssigned: entry?.tourAssigned,
                            status: entry?.status
                          })
                        }
                        
                        return (
                          <td 
                            key={dayIndex} 
                            className={cn(
                              "p-2 border-r border-slate-200 relative",
                              day.isWeekend ? "bg-slate-50" : "",
                              !canWork ? "bg-red-50" : ""
                            )}
                          >
                            <div className="space-y-2">
                              {/* Status Badge */}
                              <button
                                onClick={() => canWork && handleStatusClick(driver.id, dateStr)}
                                disabled={!canWork}
                                className={cn(
                                  "w-full px-2 py-1 rounded-md text-xs font-medium border transition-colors hover:shadow-sm",
                                  getStatusBadgeClass(entry?.status || 'available'),
                                  !canWork && "opacity-50 cursor-not-allowed bg-red-100 border-red-200"
                                )}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {getStatusIcon(entry?.status || 'available')}
                                  <span className="truncate">
                                    {!canWork ? 'Not Available' : 
                                     (entry?.status || 'available').charAt(0).toUpperCase() + 
                                     (entry?.status || 'available').slice(1)}
                                  </span>
                                </div>
                              </button>
                              
                              {/* Tour Assignment */}
                              {(entry?.status === 'scheduled' || entry?.status === 'available') && canWork ? (
                                <div className="space-y-1">
                                  <select
                                    value={entry?.tourAssigned || ''}
                                    onChange={(e) => handleTourAssignment(driver.id, dateStr, e.target.value)}
                                    className="w-full text-xs p-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    title="Select tour assignment"
                                    aria-label="Tour assignment"
                                    disabled={!canWork}
                                  >
                                    <option value="">Select Tour</option>
                                    {getDriverTourOptions(driver)
                                      .filter(tourName => canDriverWorkTour(driver, tourName))
                                      .map(tourName => {
                                        const tour = workingTours.find(t => t.name === tourName)
                                        return tour ? (
                                          <option key={tour.id} value={tour.name}>
                                            {tour.name}
                                          </option>
                                        ) : null
                                      })}
                                  </select>
                                  
                                  {entry?.tourAssigned && (
                                    <div
                                      className="text-xs px-2 py-1 rounded text-white text-center truncate tour-assignment-badge"
                                      data-color={getTourColor(entry.tourAssigned)}
                                      title={entry.tourAssigned}
                                    >
                                      {entry.tourAssigned.length > 15 
                                        ? `${entry.tourAssigned.substring(0, 15)}...` 
                                        : entry.tourAssigned
                                      }
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Weekly Analytics Summary */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Tour Summary</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="p-3 text-left font-bold text-slate-700 border-r border-slate-200 bg-slate-50">Tour Type</th>
                  {currentWeekDays.map((day, index) => (
                    <th key={index} className="p-3 text-center font-bold text-slate-700 border-r border-slate-200 bg-slate-50 min-w-[80px]">
                      {day.dayName}<br />
                      <span className="text-xs text-slate-500 font-normal">{day.shortDate}</span>
                    </th>
                  ))}
                  <th className="p-3 text-center font-bold text-slate-700 bg-slate-50">Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Next Day Cycle Tours */}
                {workingTours
                  .filter(tour => tour.name.toLowerCase().includes('next day') || tour.name.toLowerCase().includes('fc next'))
                  .map(tour => {
                    const dailyCounts = currentWeekDays.map(day => {
                      const dateStr = day.date.toISOString().split('T')[0]
                      return scheduleData.filter(s => s.date === dateStr && s.tourAssigned === tour.name).length
                    })
                    const weekTotal = dailyCounts.reduce((sum, count) => sum + count, 0)
                    
                    return (
                      <tr key={tour.id} className="border-b border-slate-100 hover:bg-slate-25">
                        <td className="p-3 font-medium text-slate-900 border-r border-slate-200">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full tour-color-dot"
                              data-color={tour.color}
                              data-color-set="true"
                            />
                            <span className="truncate" title={tour.name}>
                              {tour.name}
                            </span>
                          </div>
                        </td>
                        {dailyCounts.map((count, index) => (
                          <td key={index} className="p-3 text-center border-r border-slate-200">
                            <span className={cn(
                              "font-medium",
                              count > 0 ? "text-slate-900" : "text-slate-400"
                            )}>
                              {count}
                            </span>
                          </td>
                        ))}
                        <td className="p-3 text-center">
                          <span className="font-bold text-slate-900">
                            {weekTotal}
                          </span>
                        </td>
                      </tr>
                    )
                  })}

                {/* Same Day Tours */}
                {workingTours
                  .filter(tour => tour.name.toLowerCase().includes('same day') || tour.name.toLowerCase().includes('fc same'))
                  .map(tour => {
                    const dailyCounts = currentWeekDays.map(day => {
                      const dateStr = day.date.toISOString().split('T')[0]
                      return scheduleData.filter(s => s.date === dateStr && s.tourAssigned === tour.name).length
                    })
                    const weekTotal = dailyCounts.reduce((sum, count) => sum + count, 0)
                    
                    return (
                      <tr key={tour.id} className="border-b border-slate-100 hover:bg-slate-25">
                        <td className="p-3 font-medium text-slate-900 border-r border-slate-200">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full tour-color-dot"
                              data-color={tour.color}
                              data-color-set="true"
                            />
                            <span className="truncate" title={tour.name}>
                              {tour.name}
                            </span>
                          </div>
                        </td>
                        {dailyCounts.map((count, index) => (
                          <td key={index} className="p-3 text-center border-r border-slate-200">
                            <span className={cn(
                              "font-medium",
                              count > 0 ? "text-slate-900" : "text-slate-400"
                            )}>
                              {count}
                            </span>
                          </td>
                        ))}
                        <td className="p-3 text-center">
                          <span className="font-bold text-slate-900">
                            {weekTotal}
                          </span>
                        </td>
                      </tr>
                    )
                  })}

                {/* Spacer Row */}
                <tr className="border-b border-slate-200">
                  <td colSpan={8} className="h-2"></td>
                </tr>

                {/* Total Next Day Cycle */}
                {(() => {
                  const nextDayDailyCounts = currentWeekDays.map(day => {
                    const dateStr = day.date.toISOString().split('T')[0]
                    return scheduleData.filter(s => {
                      if (s.date !== dateStr || !s.tourAssigned) return false
                      const tourName = s.tourAssigned.toLowerCase()
                      // Count Next Day tours: Standard Parcel tours, Cycle 1, etc.
                      return tourName.includes('next day') || 
                             tourName.includes('cycle 1') ||
                             tourName.includes('standard parcel - diesel') ||
                             tourName.includes('standard parcel - evan') ||
                             tourName.includes('standard parcel medium - diesel') ||
                             tourName.includes('fc next')
                    }).length
                  })
                  const nextDayWeekTotal = nextDayDailyCounts.reduce((sum, count) => sum + count, 0)
                  
                  return (
                    <tr className="border-b border-slate-200 bg-green-50">
                      <td className="p-3 font-bold text-slate-900 border-r border-slate-200">Total Next Day Cycle</td>
                      {nextDayDailyCounts.map((count, index) => (
                        <td key={index} className="p-3 text-center border-r border-slate-200 bg-green-100">
                          <span className="font-bold text-slate-900">
                            {count}
                          </span>
                        </td>
                      ))}
                      <td className="p-3 text-center bg-green-100">
                        <span className="font-bold text-slate-900">
                          {nextDayWeekTotal}
                        </span>
                      </td>
                    </tr>
                  )
                })()}

                {/* Total Same Day A */}
                {(() => {
                  const sameDayADailyCounts = currentWeekDays.map(day => {
                    const dateStr = day.date.toISOString().split('T')[0]
                    return scheduleData.filter(s => {
                      if (s.date !== dateStr || !s.tourAssigned) return false
                      const tourName = s.tourAssigned.toLowerCase()
                      // Count Cycle A, Cycle A/B, and Cycle A/C
                      return (tourName.includes('cycle a') && !tourName.includes('cycle a/c') && !tourName.includes('cycle a/b')) ||
                             tourName.includes('cycle a/b') ||
                             tourName.includes('cycle a/c') ||
                             (tourName.includes('same day a') && !tourName.includes('same day a/c') && !tourName.includes('same day a/b'))
                    }).length
                  })
                  const sameDayAWeekTotal = sameDayADailyCounts.reduce((sum, count) => sum + count, 0)
                  
                  return (
                    <tr className="border-b border-slate-200 bg-green-50">
                      <td className="p-3 font-bold text-slate-900 border-r border-slate-200">Total Same Day A</td>
                      {sameDayADailyCounts.map((count, index) => (
                        <td key={index} className="p-3 text-center border-r border-slate-200 bg-green-100">
                          <span className="font-bold text-slate-900">
                            {count}
                          </span>
                        </td>
                      ))}
                      <td className="p-3 text-center bg-green-100">
                        <span className="font-bold text-slate-900">
                          {sameDayAWeekTotal}
                        </span>
                      </td>
                    </tr>
                  )
                })()}

                {/* Total Same Day B */}
                {(() => {
                  const sameDayBDailyCounts = currentWeekDays.map(day => {
                    const dateStr = day.date.toISOString().split('T')[0]
                    return scheduleData.filter(s => {
                      if (s.date !== dateStr || !s.tourAssigned) return false
                      const tourName = s.tourAssigned.toLowerCase()
                      // Count Cycle B, Cycle A/B, and Cycle B/C
                      return (tourName.includes('cycle b') && !tourName.includes('cycle a/b') && !tourName.includes('cycle b/c')) ||
                             tourName.includes('cycle a/b') ||
                             tourName.includes('cycle b/c') ||
                             (tourName.includes('same day b') && !tourName.includes('same day a/b') && !tourName.includes('same day b/c'))
                    }).length
                  })
                  const sameDayBWeekTotal = sameDayBDailyCounts.reduce((sum, count) => sum + count, 0)
                  
                  return (
                    <tr className="border-b border-slate-200 bg-green-50">
                      <td className="p-3 font-bold text-slate-900 border-r border-slate-200">Total Same Day B</td>
                      {sameDayBDailyCounts.map((count, index) => (
                        <td key={index} className="p-3 text-center border-r border-slate-200 bg-green-100">
                          <span className="font-bold text-slate-900">
                            {count}
                          </span>
                        </td>
                      ))}
                      <td className="p-3 text-center bg-green-100">
                        <span className="font-bold text-slate-900">
                          {sameDayBWeekTotal}
                        </span>
                      </td>
                    </tr>
                  )
                })()}

                {/* Total Same Day C */}
                {(() => {
                  const sameDayCDailyCounts = currentWeekDays.map(day => {
                    const dateStr = day.date.toISOString().split('T')[0]
                    return scheduleData.filter(s => {
                      if (s.date !== dateStr || !s.tourAssigned) return false
                      const tourName = s.tourAssigned.toLowerCase()
                      // Count Cycle C, Cycle A/C, and Cycle B/C
                      return (tourName.includes('cycle c') && !tourName.includes('cycle a/c') && !tourName.includes('cycle b/c')) ||
                             tourName.includes('cycle a/c') ||
                             tourName.includes('cycle b/c') ||
                             (tourName.includes('same day c') && !tourName.includes('same day a/c') && !tourName.includes('same day b/c'))
                    }).length
                  })
                  const sameDayCWeekTotal = sameDayCDailyCounts.reduce((sum, count) => sum + count, 0)
                  
                  return (
                    <tr className="border-b-2 border-slate-300 bg-green-50">
                      <td className="p-3 font-bold text-slate-900 border-r border-slate-200">Total Same Day C</td>
                      {sameDayCDailyCounts.map((count, index) => (
                        <td key={index} className="p-3 text-center border-r border-slate-200 bg-green-100">
                          <span className="font-bold text-slate-900">
                            {count}
                          </span>
                        </td>
                      ))}
                      <td className="p-3 text-center bg-green-100">
                        <span className="font-bold text-slate-900">
                          {sameDayCWeekTotal}
                        </span>
                      </td>
                    </tr>
                  )
                })()}

                {/* Grand Total Row */}
                {(() => {
                  const grandTotalDailyCounts = currentWeekDays.map(day => {
                    const dateStr = day.date.toISOString().split('T')[0]
                    return scheduleData.filter(s => s.date === dateStr && s.tourAssigned).length
                  })
                  const grandTotal = grandTotalDailyCounts.reduce((sum, count) => sum + count, 0)
                  
                  return (
                    <tr className="bg-blue-600 text-white border-b-2 border-blue-700">
                      <td className="p-4 font-bold border-r border-blue-500">Total (Next Day + Same Day)</td>
                      {grandTotalDailyCounts.map((count, index) => (
                        <td key={index} className="p-4 text-center border-r border-blue-500">
                          <span className="font-bold text-lg">
                            {count}
                          </span>
                        </td>
                      ))}
                      <td className="p-4 text-center">
                        <span className="font-bold text-xl">
                          {grandTotal}
                        </span>
                      </td>
                    </tr>
                  )
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Month View Placeholder */}
        {view === 'month' && (
          <div className="bg-white rounded-lg border border-slate-200 p-8">
            <div className="text-center">
              <CalendarDays className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Month View</h3>
              <p className="text-slate-600">Monthly schedule view coming soon</p>
            </div>
          </div>
        )}

        {/* Quarter View Placeholder */}
        {view === 'quarter' && (
          <div className="bg-white rounded-lg border border-slate-200 p-8">
            <div className="text-center">
              <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Quarter View</h3>
              <p className="text-slate-600">Quarterly planning view coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Reset Schedule</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-700 mb-6">
              Are you sure you want to reset all schedule assignments for this week? All drivers will be set back to "Available" status with no tour assignments.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="destructive" 
                onClick={confirmResetSchedule}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Schedule
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Work Pattern Configuration Modal */}
      {showWorkPatternModal && selectedDriverForPattern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Configure Work Pattern for {selectedDriverForPattern.name}
            </h3>
            
            <WorkPatternForm 
              driver={selectedDriverForPattern}
              workingTours={workingTours}
              onSave={saveWorkPattern}
              onCancel={() => {
                setShowWorkPatternModal(false)
                setSelectedDriverForPattern(null)
              }}
              onDelete={deleteWorkPattern}
            />
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Import Schedule</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close import modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Week Offset (0 = current week, 1 = next week, -1 = previous week)
                </label>
                <input
                  type="number"
                  value={importWeekOffset}
                  onChange={(e) => setImportWeekOffset(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Schedule JSON Data
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Paste exported schedule JSON here..."
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Holiday Integration</p>
                    <p>The import will automatically check for approved holiday requests in the target week and set drivers to "Holiday" status on those dates.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={importSchedule}
                disabled={!importData.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
