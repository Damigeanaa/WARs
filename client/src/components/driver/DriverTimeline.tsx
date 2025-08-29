import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Calendar, Award, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'

interface Warning {
  id: number
  type: string
  description: string
  severity: 'Low' | 'Medium' | 'High'
  status: 'Active' | 'Under Review' | 'Resolved'
  date: string
  location?: string
  created_at: string
}

interface Holiday {
  id: number
  start_date: string
  end_date: string
  days: number
  type: string
  status: 'Pending' | 'Approved' | 'Rejected'
  reason?: string
  request_date: string
}

interface TimelineEvent {
  id: string
  type: 'warning' | 'holiday' | 'achievement'
  date: string
  title: string
  description: string
  status?: string
  severity?: string
  icon: React.ReactNode
  color: string
  data?: Warning | Holiday
}


export default function DriverTimeline({ driverId }: { driverId: number }) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'warnings' | 'holidays' | 'achievements'>('all')

  useEffect(() => {
    fetchTimelineData()
  }, [driverId])

  const fetchTimelineData = async () => {
    try {
      setIsLoading(true)

      // Fetch warnings
      const warningsResponse = await fetch(`/api/warnings?driver_id=${driverId}`)
      const warnings: Warning[] = warningsResponse.ok ? await warningsResponse.json() : []

      // Fetch holidays
      const holidaysResponse = await fetch(`/api/holidays?driver_id=${driverId}`)
      const holidays: Holiday[] = holidaysResponse.ok ? await holidaysResponse.json() : []

      // Convert to timeline events
      const timelineEvents: TimelineEvent[] = []

      // Add warning events
      warnings.forEach(warning => {
        timelineEvents.push({
          id: `warning-${warning.id}`,
          type: 'warning',
          date: warning.date,
          title: warning.type,
          description: warning.description,
          status: warning.status,
          severity: warning.severity,
          icon: <AlertTriangle className="h-4 w-4" />,
          color: getSeverityColor(warning.severity),
          data: warning
        })
      })

      // Add holiday events
      holidays.forEach(holiday => {
        timelineEvents.push({
          id: `holiday-${holiday.id}`,
          type: 'holiday',
          date: holiday.start_date,
          title: `${holiday.type} (${holiday.days} days)`,
          description: holiday.reason || `${format(parseISO(holiday.start_date), 'MMM dd')} - ${format(parseISO(holiday.end_date), 'MMM dd, yyyy')}`,
          status: holiday.status,
          icon: <Calendar className="h-4 w-4" />,
          color: getHolidayStatusColor(holiday.status),
          data: holiday
        })
      })

      // Add achievement events (generated based on performance)
      const achievements = generateAchievements(warnings, holidays)
      timelineEvents.push(...achievements)

      // Sort by date (newest first)
      timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setEvents(timelineEvents)
    } catch (error) {
      console.error('Error fetching timeline data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateAchievements = (warnings: Warning[], holidays: Holiday[]): TimelineEvent[] => {
    const achievements: TimelineEvent[] = []
    const currentDate = new Date()

    // Achievement: No warnings in last 6 months
    const recentWarnings = warnings.filter(w => {
      const warningDate = parseISO(w.date)
      return differenceInDays(currentDate, warningDate) <= 180
    })

    if (recentWarnings.length === 0 && warnings.length > 0) {
      achievements.push({
        id: 'achievement-no-warnings-6m',
        type: 'achievement',
        date: format(new Date(currentDate.getTime() - 180 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        title: 'Excellent Performance',
        description: 'No warnings in the last 6 months',
        icon: <Award className="h-4 w-4" />,
        color: 'text-green-600 bg-green-100'
      })
    }

    // Achievement: Responsible holiday planning
    const approvedHolidays = holidays.filter(h => h.status === 'Approved')
    if (approvedHolidays.length >= 2) {
      const latestHoliday = approvedHolidays.sort((a, b) => 
        new Date(b.request_date).getTime() - new Date(a.request_date).getTime()
      )[0]
      
      achievements.push({
        id: 'achievement-holiday-planning',
        type: 'achievement',
        date: latestHoliday.request_date,
        title: 'Excellent Planning',
        description: 'Consistently plans holidays in advance',
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'text-blue-600 bg-blue-100'
      })
    }

    // Achievement: Quick issue resolution
    const resolvedWarnings = warnings.filter(w => w.status === 'Resolved')
    if (resolvedWarnings.length > 0) {
      const latestResolved = resolvedWarnings.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
      
      achievements.push({
        id: 'achievement-quick-resolution',
        type: 'achievement',
        date: latestResolved.created_at,
        title: 'Problem Solver',
        description: 'Actively resolves issues and maintains good standing',
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-purple-600 bg-purple-100'
      })
    }

    return achievements
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getHolidayStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100'
      case 'Pending': return 'text-yellow-600 bg-yellow-100'
      case 'Rejected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    if (filter === 'warnings') return event.type === 'warning'
    if (filter === 'holidays') return event.type === 'holiday'
    if (filter === 'achievements') return event.type === 'achievement'
    return false
  })

  const getPerformanceMetrics = () => {
    const totalWarnings = events.filter(e => e.type === 'warning').length
    const activeWarnings = events.filter(e => e.type === 'warning' && e.status === 'Active').length
    const resolvedWarnings = events.filter(e => e.type === 'warning' && e.status === 'Resolved').length
    const achievements = events.filter(e => e.type === 'achievement').length
    const approvedHolidays = events.filter(e => e.type === 'holiday' && e.status === 'Approved').length

    return {
      totalWarnings,
      activeWarnings,
      resolvedWarnings,
      achievements,
      approvedHolidays,
      resolutionRate: totalWarnings > 0 ? Math.round((resolvedWarnings / totalWarnings) * 100) : 0
    }
  }

  const metrics = getPerformanceMetrics()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.activeWarnings}</div>
              <div className="text-xs text-gray-500">Active Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.totalWarnings}</div>
              <div className="text-xs text-gray-500">Total Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.resolutionRate}%</div>
              <div className="text-xs text-gray-500">Resolution Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.achievements}</div>
              <div className="text-xs text-gray-500">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">{metrics.approvedHolidays}</div>
              <div className="text-xs text-gray-500">Holidays Taken</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${metrics.activeWarnings === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.activeWarnings === 0 ? '✓' : '!'}
              </div>
              <div className="text-xs text-gray-500">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Timeline
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({events.length})
              </Button>
              <Button
                variant={filter === 'warnings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('warnings')}
              >
                Warnings ({events.filter(e => e.type === 'warning').length})
              </Button>
              <Button
                variant={filter === 'holidays' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('holidays')}
              >
                Holidays ({events.filter(e => e.type === 'holiday').length})
              </Button>
              <Button
                variant={filter === 'achievements' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('achievements')}
              >
                Achievements ({events.filter(e => e.type === 'achievement').length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No timeline events found</p>
              <p className="text-sm text-gray-400 mt-2">
                {filter === 'all' ? 'This driver has no recorded activity yet.' : `No ${filter} to display.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${event.color}`}>
                      {event.icon}
                    </div>
                    {index < filteredEvents.length - 1 && (
                      <div className="w-px h-6 bg-gray-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {format(parseISO(event.date), 'MMM dd, yyyy')}
                          </span>
                          {event.status && (
                            <Badge variant="outline" className="text-xs">
                              {event.status}
                            </Badge>
                          )}
                          {event.severity && (
                            <Badge variant="outline" className="text-xs">
                              {event.severity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < filteredEvents.length - 1 && <Separator className="mt-4" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
