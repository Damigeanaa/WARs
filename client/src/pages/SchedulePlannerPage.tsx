import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { API_ENDPOINTS } from '@/config/api'
import { 
  Calendar, 
  Plus, 
  Check,
  X,
  Clock,
  AlertTriangle,
  User,
  CalendarDays,
  Users2,
  Truck,
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Driver {
  id: number
  name: string
  driver_id: string
  van_license_plate?: string
  status: 'Active' | 'Inactive' | 'On Holiday'
  employment_type: 'Fulltime' | 'Minijob'
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

const quarters = [
  { name: 'Q1', months: ['January', 'February', 'March'], color: 'bg-blue-100 text-blue-800' },
  { name: 'Q2', months: ['April', 'May', 'June'], color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Q3', months: ['July', 'August', 'September'], color: 'bg-green-100 text-green-800' },
  { name: 'Q4', months: ['October', 'November', 'December'], color: 'bg-purple-100 text-purple-800' }
]

const monthsData = [
  { name: 'January', weeks: ['W2', 'W3', 'W4', 'W5'] },
  { name: 'February', weeks: ['W6', 'W7', 'W8', 'W9'] },
  { name: 'March', weeks: ['W10', 'W11', 'W12', 'W13', 'W14'] },
  { name: 'April', weeks: ['W15', 'W16', 'W17', 'W18'] },
  { name: 'May', weeks: ['W19', 'W20', 'W21', 'W22'] },
  { name: 'June', weeks: ['W23', 'W24', 'W25', 'W26', 'W27'] },
  { name: 'July', weeks: ['W28', 'W29', 'W30', 'W31'] },
  { name: 'August', weeks: ['W32', 'W33', 'W34', 'W35'] },
  { name: 'September', weeks: ['W36', 'W37', 'W38', 'W39', 'W40'] },
  { name: 'October', weeks: ['W41', 'W42', 'W43', 'W44'] },
  { name: 'November', weeks: ['W45', 'W46', 'W47', 'W48'] },
  { name: 'December', weeks: ['W49', 'W50', 'W51', 'W52'] }
]

const getStatusIcon = (status: string) => {
  // Only show status icons, not tour assignment icons
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

export default function SchedulePlannerPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedWeek, setSelectedWeek] = useState(() => {
    // Calculate current week on initialization
    const now = new Date()
    const target = new Date(now.valueOf())
    const dayNumber = (now.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNumber + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    const currentWeek = 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000))
    return Math.min(52, Math.max(1, currentWeek))
  })
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [workingTours, setWorkingTours] = useState<WorkingTour[]>([])
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([])
  const [editingCell, setEditingCell] = useState<{driverId: number, date: string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentWeekDays, setCurrentWeekDays] = useState<WeekDay[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchDrivers()
    fetchWorkingTours()
    calculateCurrentWeek()
  }, [selectedYear])

  useEffect(() => {
    generateWeekDays()
    fetchScheduleData()
  }, [selectedWeek, selectedYear])

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers')
      const data = await response.json()
      setDrivers(data.filter((driver: Driver) => driver.status === 'Active'))
    } catch (error) {
      console.error('Error fetching drivers:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch drivers',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkingTours = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.workingTours)
      const data = await response.json()
      setWorkingTours(data.filter((tour: WorkingTour) => tour.is_active === 1))
    } catch (error) {
      console.error('Error fetching working tours:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch working tours',
        variant: 'destructive'
      })
    }
  }

  const fetchScheduleData = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.schedules}?year=${selectedYear}&week=${selectedWeek}`)
      const data = await response.json()
      
      // Convert API data to local format
      const scheduleEntries: ScheduleEntry[] = data.map((item: any) => ({
        driverId: item.driver_id,
        date: item.schedule_date,
        status: item.status,
        tourAssigned: item.van_assigned,
        notes: item.notes
      }))
      
      setScheduleData(scheduleEntries)
    } catch (error) {
      console.error('Error fetching schedule data:', error)
      // Don't show toast for this as it's not critical
    }
  }

  const calculateCurrentWeek = () => {
    const now = new Date()
    // Only calculate current week if we're viewing the current year
    if (selectedYear !== now.getFullYear()) {
      setSelectedWeek(1)
      return
    }
    
    // Calculate ISO week number
    const currentWeek = getISOWeekNumber(now)
    setSelectedWeek(Math.min(52, Math.max(1, currentWeek)))
  }

  // Helper function to get ISO week number
  const getISOWeekNumber = (date: Date): number => {
    const target = new Date(date.valueOf())
    const dayNumber = (date.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNumber + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000))
  }

  const generateWeekDays = () => {
    const startOfYear = new Date(selectedYear, 0, 1)
    const startOfWeek = new Date(startOfYear)
    startOfWeek.setDate(startOfYear.getDate() + (selectedWeek - 1) * 7)
    
    // Find the Monday of this week
    const dayOfWeek = startOfWeek.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset)

    const weekDays: WeekDay[] = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      
      weekDays.push({
        date: currentDate,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        shortDate: currentDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        isToday: currentDate.toDateString() === today.toDateString(),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6
      })
    }
    
    setCurrentWeekDays(weekDays)
  }

  const getDriverScheduleStatus = (driverId: number, date: Date): string => {
    const dateStr = date.toISOString().split('T')[0]
    const entry = scheduleData.find(s => s.driverId === driverId && s.date === dateStr)
    return entry?.status || 'available'
  }

  const getDriverTourAssignment = (driverId: number, date: Date): string | undefined => {
    const dateStr = date.toISOString().split('T')[0]
    const entry = scheduleData.find(s => s.driverId === driverId && s.date === dateStr)
    return entry?.tourAssigned
  }

  const getTourColor = (tourName: string): string => {
    const tour = workingTours.find(t => t.name === tourName)
    return tour?.color || '#06B6D4' // Default blue color
  }

  const handleTourAssignment = async (driverId: number, date: Date, tourName: string) => {
    const dateStr = date.toISOString().split('T')[0]
    const currentEntry = scheduleData.find(s => s.driverId === driverId && s.date === dateStr)
    
    if (!currentEntry || !['available', 'scheduled'].includes(currentEntry.status)) {
      toast({
        title: 'Cannot Assign Tour',
        description: 'Driver must be available or scheduled to assign a tour',
        variant: 'destructive'
      })
      return
    }

    // Update local state
    setScheduleData(prev => {
      const filtered = prev.filter(s => !(s.driverId === driverId && s.date === dateStr))
      return [...filtered, { ...currentEntry, tourAssigned: tourName }]
    })

    // Save to backend
    try {
      const response = await fetch(API_ENDPOINTS.schedulesBulk, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: [{
            driver_id: driverId,
            schedule_date: dateStr,
            status: currentEntry.status,
            van_assigned: tourName
          }]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save tour assignment')
      }

      toast({
        title: 'Tour Assigned',
        description: `${tourName} assigned to driver for ${dateStr}`,
      })
    } catch (error) {
      console.error('Error saving tour assignment:', error)
      toast({
        title: 'Error',
        description: 'Failed to save tour assignment',
        variant: 'destructive'
      })
      
      // Revert local state on error
      setScheduleData(prev => {
        const filtered = prev.filter(s => !(s.driverId === driverId && s.date === dateStr))
        return [...filtered, { ...currentEntry, tourAssigned: currentEntry.tourAssigned }]
      })
    }

    setEditingCell(null)
  }

  const toggleDriverStatus = async (driverId: number, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const currentStatus = getDriverScheduleStatus(driverId, date)
    
    const statusCycle = ['available', 'scheduled', 'holiday', 'sick', 'unavailable']
    const currentIndex = statusCycle.indexOf(currentStatus)
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]
    
    // Optimistically update local state
    setScheduleData(prev => {
      const filtered = prev.filter(s => !(s.driverId === driverId && s.date === dateStr))
      return [...filtered, { driverId, date: dateStr, status: nextStatus as any }]
    })

    // Save to backend
    try {
      const response = await fetch(API_ENDPOINTS.schedulesBulk, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: [{
            driver_id: driverId,
            schedule_date: dateStr,
            status: nextStatus
          }]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save schedule')
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to save schedule changes',
        variant: 'destructive'
      })
      
      // Revert local state on error
      setScheduleData(prev => {
        const filtered = prev.filter(s => !(s.driverId === driverId && s.date === dateStr))
        if (currentStatus !== 'available') {
          return [...filtered, { driverId, date: dateStr, status: currentStatus as any }]
        }
        return filtered
      })
    }
  }

  const getAbsentDaysCount = (driverId: number): number => {
    return scheduleData.filter(s => 
      s.driverId === driverId && 
      ['holiday', 'sick', 'unavailable'].includes(s.status)
    ).length
  }

  const getWeekDateRange = () => {
    if (currentWeekDays.length === 0) return ''
    const startDate = currentWeekDays[0].date
    const endDate = currentWeekDays[6].date
    
    return `${startDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    })} - ${endDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    })}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full animate-spin animation-delay-150 mx-auto"></div>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-700">Loading Schedule Planner</h2>
          <p className="mt-2 text-slate-500">Preparing your driver scheduling interface...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>
        {quarters.map((_, qIndex) => {
          const quarterProgress = Math.floor(Math.random() * 100)
          return `
            .quarter-progress-${qIndex} {
              width: ${quarterProgress}%;
            }
          `
        }).join('')}
        {workingTours.map((tour) => `
          .tour-display[data-tour-color="${tour.color}"] {
            border-color: ${tour.color};
            background-color: ${tour.color}08;
          }
          .tour-icon[data-tour-color="${tour.color}"] {
            color: ${tour.color};
          }
          .tour-text[data-tour-color="${tour.color}"] {
            color: ${tour.color};
          }
        `).join('')}
      </style>
      <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Driver Schedule Planner</h1>
                <p className="text-slate-600">
                  Plan your drivers' weekly schedules from Week 1 to Week 52.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Users2 className="h-4 w-4" />
                {drivers.length} Active Drivers
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Week {selectedWeek} of {selectedYear}
              </span>
              <Badge variant="outline" className="text-xs">
                User ID: 16585831783359119148
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Year and Week Navigation */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Select Year"
                aria-label="Select Year"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedWeek(Math.min(52, selectedWeek + 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-slate-200">
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
              
              <Button size="sm" variant="outline" className="border-slate-200">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                <Plus className="h-4 w-4 mr-1" />
                Quick Actions
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Year Overview with Enhanced Design */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Sophisticated Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                  <CalendarDays className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">{selectedYear} Year Overview</h2>
                  <p className="text-white/80 text-lg">Navigate through quarters and plan your year</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm">
                  Current: Week {selectedWeek}
                </Badge>
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quarter Panels */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {quarters.map((quarter, qIndex) => {
              const quarterProgress = Math.floor(Math.random() * 100) // You can replace with actual progress calculation
              const isCurrentQuarter = selectedWeek >= (qIndex * 13 + 1) && selectedWeek <= ((qIndex + 1) * 13)
              
              return (
                <div 
                  key={quarter.name} 
                  className={cn(
                    "group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105",
                    "bg-gradient-to-br shadow-lg hover:shadow-2xl border-2",
                    quarter.name === 'Q1' && "from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200",
                    quarter.name === 'Q2' && "from-emerald-50 to-emerald-100 border-emerald-200 hover:from-emerald-100 hover:to-emerald-200",
                    quarter.name === 'Q3' && "from-amber-50 to-amber-100 border-amber-200 hover:from-amber-100 hover:to-amber-200",
                    quarter.name === 'Q4' && "from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-200",
                    isCurrentQuarter && "ring-4 ring-offset-2 ring-indigo-500/50"
                  )}
                >
                  {/* Quarter Header */}
                  <div className="p-6 border-b border-white/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg",
                          quarter.name === 'Q1' && "bg-blue-500",
                          quarter.name === 'Q2' && "bg-emerald-500", 
                          quarter.name === 'Q3' && "bg-amber-500",
                          quarter.name === 'Q4' && "bg-purple-500"
                        )}>
                          {quarter.name}
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-slate-800">{quarter.name} 2025</h3>
                          <p className="text-slate-600 text-sm">Quarter {qIndex + 1}</p>
                        </div>
                      </div>
                      {isCurrentQuarter && (
                        <Badge className="bg-indigo-500 text-white px-3 py-1 animate-pulse">
                          Active
                        </Badge>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Progress</span>
                        <span>{quarterProgress}%</span>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                        <div 
                          className={cn(
                            `quarter-progress-${qIndex}`,
                            "h-full rounded-full transition-all duration-1000 shadow-sm",
                            quarter.name === 'Q1' && "bg-gradient-to-r from-blue-400 to-blue-600",
                            quarter.name === 'Q2' && "bg-gradient-to-r from-emerald-400 to-emerald-600",
                            quarter.name === 'Q3' && "bg-gradient-to-r from-amber-400 to-amber-600",
                            quarter.name === 'Q4' && "bg-gradient-to-r from-purple-400 to-purple-600"
                          )}
                        ></div>
                      </div>
                    </div>

                    {/* Month Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {quarter.months.map((month) => (
                        <div key={month} className="text-center">
                          <div className="text-xs font-medium text-slate-600 mb-1">
                            {month.slice(0, 3)}
                          </div>
                          <div className={cn(
                            "w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-bold text-white",
                            quarter.name === 'Q1' && "bg-blue-400",
                            quarter.name === 'Q2' && "bg-emerald-400",
                            quarter.name === 'Q3' && "bg-amber-400", 
                            quarter.name === 'Q4' && "bg-purple-400"
                          )}>
                            {Math.floor(Math.random() * 30) + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Month/Week Navigation */}
                  <div className="p-6 space-y-4">
                    {quarter.months.map((month, mIndex) => {
                      const monthData = monthsData[qIndex * 3 + mIndex]
                      const isCurrentMonth = new Date().getMonth() === (qIndex * 3 + mIndex)
                      
                      return (
                        <div key={month} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className={cn(
                              "font-semibold text-sm",
                              isCurrentMonth ? "text-indigo-700" : "text-slate-700"
                            )}>
                              {month}
                              {isCurrentMonth && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  Current
                                </span>
                              )}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {monthData?.weeks.length || 0}W
                            </Badge>
                          </div>
                          
                          {/* Week Grid with Enhanced Design */}
                          <div className="grid grid-cols-4 gap-2">
                            {monthData?.weeks.map(week => {
                              const weekNum = parseInt(week.substring(1))
                              const isSelected = selectedWeek === weekNum
                              
                              return (
                                <button
                                  key={week}
                                  onClick={() => setSelectedWeek(weekNum)}
                                  className={cn(
                                    "relative p-2 text-xs font-medium rounded-lg transition-all duration-200 border-2",
                                    "hover:scale-110 hover:shadow-lg transform",
                                    isSelected ? [
                                      "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-300",
                                      "shadow-lg scale-110 ring-2 ring-indigo-200"
                                    ] : [
                                      "bg-white/60 hover:bg-white border-slate-200 text-slate-700",
                                      "hover:border-indigo-300 hover:text-indigo-700"
                                    ]
                                  )}
                                >
                                  {week}
                                  {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full border-2 border-white"></div>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Quarter Summary Footer */}
                  <div className={cn(
                    "px-6 py-4 border-t border-white/50",
                    quarter.name === 'Q1' && "bg-blue-50/50",
                    quarter.name === 'Q2' && "bg-emerald-50/50",
                    quarter.name === 'Q3' && "bg-amber-50/50",
                    quarter.name === 'Q4' && "bg-purple-50/50"
                  )}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Weeks {(qIndex * 13) + 1}-{(qIndex + 1) * 13}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-slate-600">Scheduled</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          <span className="text-slate-600">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
                </div>
              )
            })}
          </div>

          {/* Year Summary Statistics */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Weeks</p>
                  <p className="text-2xl font-bold text-blue-800">52</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Users2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-emerald-600 text-sm font-medium">Active Drivers</p>
                  <p className="text-2xl font-bold text-emerald-800">{drivers.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-amber-600 text-sm font-medium">Current Week</p>
                  <p className="text-2xl font-bold text-amber-800">{selectedWeek}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-purple-600 text-sm font-medium">Completion</p>
                  <p className="text-2xl font-bold text-purple-800">{Math.floor((selectedWeek / 52) * 100)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern & Simple Weekly Schedule */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Clean Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Week {selectedWeek} Schedule</h2>
                <p className="text-slate-300 text-sm">{getWeekDateRange()}</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/20 px-4 py-2">
              {drivers.length} Drivers
            </Badge>
          </div>
        </div>

        {/* Simplified Schedule Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header Row */}
            <div className="grid grid-cols-[250px_repeat(7,1fr)_120px] bg-slate-50 border-b border-slate-200">
              <div className="p-4 font-semibold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Driver
              </div>
              {currentWeekDays.map((day) => (
                <div 
                  key={day.date.toISOString()} 
                  className={cn(
                    "p-4 text-center font-medium",
                    day.isToday ? "bg-blue-50 text-blue-700 border-l-2 border-r-2 border-blue-500" : "text-slate-600",
                    day.isWeekend && "bg-slate-100 text-slate-500"
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-semibold">{day.dayName}</span>
                    <span className="text-xs opacity-70">{day.shortDate}</span>
                    {day.isToday && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
              <div className="p-4 text-center font-medium text-slate-600">
                <div className="flex flex-col items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Absent</span>
                </div>
              </div>
            </div>

            {/* Driver Rows */}
            <div className="divide-y divide-slate-100">
              {drivers.map((driver, index) => (
                <div key={driver.id} className={cn(
                  "grid grid-cols-[250px_repeat(7,1fr)_120px] hover:bg-slate-50/50 transition-colors",
                  index % 2 === 0 ? "bg-white" : "bg-slate-25"
                )}>
                  {/* Driver Info */}
                  <div className="p-4 border-r border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                        {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 truncate">{driver.name}</div>
                        <div className="text-xs text-slate-500">ID: {driver.driver_id}</div>
                      </div>
                    </div>
                  </div>

                  {/* Day Schedule Cells */}
                  {currentWeekDays.map((day) => {
                    const status = getDriverScheduleStatus(driver.id, day.date)
                    const tourAssigned = getDriverTourAssignment(driver.id, day.date)
                    const isEditing = editingCell?.driverId === driver.id && editingCell?.date === day.date.toISOString().split('T')[0]
                    
                    return (
                      <div key={day.date.toISOString()} className={cn(
                        "p-3 border-r border-slate-100 flex items-center justify-center min-h-[80px]",
                        day.isToday && "bg-blue-50/50"
                      )}>
                        {isEditing && (status === 'available' || status === 'scheduled') ? (
                          // Simple Tour Selection
                          <div className="relative w-full">
                            <select 
                              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              value={tourAssigned || ''}
                              onChange={(e) => handleTourAssignment(driver.id, day.date, e.target.value)}
                              title="Select tour assignment"
                              aria-label="Select tour assignment"
                              autoFocus
                            >
                              <option value="">No Tour</option>
                              {workingTours.map((tour) => (
                                <option key={tour.id} value={tour.name}>
                                  {tour.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingCell(null)}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-slate-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-slate-700"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            {tourAssigned ? (
                              // Clean Tour Display
                              <div 
                                className="px-3 py-2 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-md bg-white tour-display"
                                data-tour-color={getTourColor(tourAssigned)}
                                onClick={() => toggleDriverStatus(driver.id, day.date)}
                                onContextMenu={(e) => {
                                  e.preventDefault()
                                  setEditingCell({driverId: driver.id, date: day.date.toISOString().split('T')[0]})
                                }}
                                title={`${status} - ${tourAssigned}`}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <Truck className="h-4 w-4 tour-icon" data-tour-color={getTourColor(tourAssigned)} />
                                  <span 
                                    className="text-xs font-medium text-center tour-text"
                                    data-tour-color={getTourColor(tourAssigned)}
                                  >
                                    {tourAssigned.length > 12 ? tourAssigned.substring(0, 12) + '...' : tourAssigned}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Clean Status Button
                              <button
                                onClick={() => toggleDriverStatus(driver.id, day.date)}
                                onContextMenu={(e) => {
                                  e.preventDefault()
                                  if (status === 'available' || status === 'scheduled') {
                                    setEditingCell({driverId: driver.id, date: day.date.toISOString().split('T')[0]})
                                  }
                                }}
                                className={cn(
                                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                                  status === 'available' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 focus:ring-emerald-500",
                                  status === 'scheduled' && "bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500",
                                  status === 'holiday' && "bg-amber-100 text-amber-700 hover:bg-amber-200 focus:ring-amber-500",
                                  status === 'sick' && "bg-rose-100 text-rose-700 hover:bg-rose-200 focus:ring-rose-500",
                                  status === 'unavailable' && "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500"
                                )}
                                title={status.charAt(0).toUpperCase() + status.slice(1)}
                              >
                                {getStatusIcon(status)}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Absent Days Count */}
                  <div className="p-4 flex items-center justify-center">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                      getAbsentDaysCount(driver.id) > 3 
                        ? "bg-rose-100 text-rose-700" 
                        : "bg-emerald-100 text-emerald-700"
                    )}>
                      {getAbsentDaysCount(driver.id)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Simple Legend & Stats */}
        <div className="bg-slate-50 p-6 border-t border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Legend */}
            <div>
              <h4 className="font-semibold text-slate-700 mb-3">Status Legend</h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { status: 'available', label: 'Available', color: 'bg-emerald-100 text-emerald-700' },
                  { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
                  { status: 'holiday', label: 'Holiday', color: 'bg-amber-100 text-amber-700' },
                  { status: 'sick', label: 'Sick', color: 'bg-rose-100 text-rose-700' },
                  { status: 'unavailable', label: 'Unavailable', color: 'bg-slate-100 text-slate-700' }
                ].map(({ status, label, color }) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={cn("w-4 h-4 rounded", color)}></div>
                    <span className="text-sm text-slate-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <h4 className="font-semibold text-slate-700 mb-3">Week Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {scheduleData.filter(s => s.status === 'scheduled').length}
                  </div>
                  <div className="text-xs text-slate-600">Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">
                    {scheduleData.filter(s => s.status === 'holiday').length}
                  </div>
                  <div className="text-xs text-slate-600">On Holiday</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">
                    {scheduleData.filter(s => s.status === 'available').length}
                  </div>
                  <div className="text-xs text-slate-600">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-rose-600">
                    {scheduleData.filter(s => ['sick', 'unavailable'].includes(s.status)).length}
                  </div>
                  <div className="text-xs text-slate-600">Unavailable</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
