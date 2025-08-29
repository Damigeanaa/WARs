import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDashboardAutoRefresh } from '@/hooks/useAutoRefresh'
import { API_ENDPOINTS } from '@/config/api'
import { 
  Users, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  TrendingDown,
  MapPin,
  Award,
  Clock,
  Shield,
  BarChart3,
  Activity,
  ArrowUpRight,
  Zap,
  CheckCircle2
} from 'lucide-react'

interface Driver {
  id: number
  driver_id: string
  name: string
  email: string
  contact_number: string
  license_number: string
  vehicle_assigned: string
  status: string
  created_at: string
  updated_at: string
}

interface Warning {
  id: number
  driver_id: number
  warning_type: string
  severity: string
  description: string
  date_issued: string
  status: string
  created_at: string
}

interface HolidayRequest {
  id: number
  driver_id: string  // This should be string to match the driver_id field
  start_date: string
  end_date: string
  reason: string
  status: string
  created_at: string
}

export default function Dashboard() {
  const navigate = useNavigate()

  // Auto-refresh functionality  
  const { isEnabled } = useDashboardAutoRefresh(true)

  // Fetch drivers
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async (): Promise<Driver[]> => {
      const response = await fetch(API_ENDPOINTS.drivers)
      if (!response.ok) {
        throw new Error('Failed to fetch drivers')
      }
      return response.json()
    }
  })

  // Fetch warnings
  const { data: warnings = [], isLoading: warningsLoading } = useQuery({
    queryKey: ['warnings'],
    queryFn: async (): Promise<Warning[]> => {
      const response = await fetch(API_ENDPOINTS.warnings)
      if (!response.ok) {
        throw new Error('Failed to fetch warnings')
      }
      return response.json()
    }
  })

  // Fetch holiday requests
  const { data: holidayRequests = [], isLoading: holidayRequestsLoading } = useQuery({
    queryKey: ['holiday-requests'],
    queryFn: async (): Promise<HolidayRequest[]> => {
      const response = await fetch(API_ENDPOINTS.holidayRequestsPublicAll)
      if (!response.ok) {
        throw new Error('Failed to fetch holiday requests')
      }
      return response.json()
    }
  })

  // Calculate stats from the data
  const stats = {
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(d => d.status === 'Active').length,
    totalWarnings: warnings.length,
    activeWarnings: warnings.filter(w => w.status === 'Active').length,
    highSeverityWarnings: warnings.filter(w => w.severity === 'High').length,
    pendingHolidays: holidayRequests.filter(r => r.status === 'pending').length,
    approvedHolidays: holidayRequests.filter(r => r.status === 'approved').length
  }

  const isLoading = driversLoading || warningsLoading || holidayRequestsLoading

  // Recent warnings (last 5)
  const recentWarnings = warnings
    .sort((a, b) => new Date(b.date_issued).getTime() - new Date(a.date_issued).getTime())
    .slice(0, 5)

  // Recent holiday requests (last 5)
  const recentHolidayRequests = holidayRequests
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const metrics = [
    {
      title: 'Total Drivers',
      value: isLoading ? '...' : stats.totalDrivers.toString(),
      icon: Users,
      change: stats.activeDrivers,
      changeType: 'neutral' as const,
      description: `${stats.activeDrivers} active`
    },
    {
      title: 'Active Warnings',
      value: isLoading ? '...' : stats.activeWarnings.toString(),
      icon: AlertTriangle,
      change: stats.highSeverityWarnings,
      changeType: stats.highSeverityWarnings > 0 ? 'negative' as const : 'positive' as const,
      description: `${stats.highSeverityWarnings} high severity`
    },
    {
      title: 'Holiday Requests',
      value: isLoading ? '...' : stats.pendingHolidays.toString(),
      icon: Calendar,
      change: stats.approvedHolidays,
      changeType: 'neutral' as const,
      description: `${stats.approvedHolidays} approved`
    },
    {
      title: 'Performance Score',
      value: isLoading ? '...' : Math.round(((stats.totalDrivers - stats.highSeverityWarnings) / Math.max(stats.totalDrivers, 1)) * 100).toString() + '%',
      icon: Award,
      change: stats.highSeverityWarnings === 0 ? 5 : -stats.highSeverityWarnings,
      changeType: stats.highSeverityWarnings === 0 ? 'positive' as const : 'negative' as const,
      description: 'Overall fleet health'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-2 mb-6">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">Real-time Analytics</span>
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Live</Badge>
            </div>
            
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Fleet Management Dashboard
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Monitor your fleet performance, driver status, and operational metrics in real-time.
            </p>
            
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-slate-400'}`} />
              <span className="text-sm text-slate-600">
                {isEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'} • Updates every 30 seconds
              </span>
            </div>
          </div>

          {/* Enhanced Key Metrics Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-2xl transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700">
                    {metric.title}
                  </CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <metric.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{metric.value}</div>
                  <p className="text-sm text-slate-600 mb-3">
                    {metric.description}
                  </p>
                  <div className="flex items-center">
                    {metric.changeType === 'positive' ? (
                      <>
                        <TrendingUp className="mr-1 h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600 font-medium">
                          +{Math.abs(metric.change)}
                        </span>
                      </>
                    ) : metric.changeType === 'negative' ? (
                      <>
                        <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">
                          {metric.change}
                        </span>
                      </>
                    ) : (
                      <>
                        <Activity className="mr-1 h-4 w-4 text-indigo-500" />
                        <span className="text-sm text-indigo-600 font-medium">
                          {Math.abs(metric.change)} active
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Data Grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Recent Warnings - Enhanced */}
            <Card className="lg:col-span-2 border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900">Recent Warnings</CardTitle>
                      <CardDescription className="text-slate-600">
                        Latest driver warnings requiring attention
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/warnings')}
                    className="border-slate-300 hover:border-orange-300 hover:bg-orange-50"
                  >
                    View All
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center text-slate-500 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      Loading warnings...
                    </div>
                  ) : recentWarnings.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="font-medium">No recent warnings</p>
                      <p className="text-sm">Your fleet is performing well!</p>
                    </div>
                  ) : (
                    recentWarnings.map((warning) => {
                      const driver = drivers.find(d => d.id === warning.driver_id)
                      return (
                        <div key={warning.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <Users className="h-4 w-4 text-slate-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">
                                {driver?.name || 'Unknown Driver'}
                              </p>
                              <p className="text-sm text-slate-600">
                                {warning.warning_type}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {warning.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge 
                              variant={
                                warning.severity === 'High' ? 'destructive' :
                                warning.severity === 'Medium' ? 'default' : 'secondary'
                              }
                              className="shadow-sm"
                            >
                              {warning.severity}
                            </Badge>
                            <p className="text-xs text-slate-500">
                              {new Date(warning.date_issued).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Holiday Requests - Enhanced */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900">Holiday Requests</CardTitle>
                      <CardDescription className="text-slate-600">
                        Recent booking requests
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/holidays')}
                    className="border-slate-300 hover:border-green-300 hover:bg-green-50"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center text-slate-500 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      Loading requests...
                    </div>
                  ) : recentHolidayRequests.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="font-medium">No recent requests</p>
                      <p className="text-sm">All caught up!</p>
                    </div>
                  ) : (
                    recentHolidayRequests.map((request) => {
                      // Match holiday request driver_id (string like "DRV001") with driver.driver_id (string)
                      const driver = drivers.find(d => d.driver_id === request.driver_id)
                      
                      return (
                        <div key={request.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-slate-900">
                              {driver?.name || 'Unknown Driver'}
                            </p>
                            <Badge 
                              variant={
                                request.status === 'approved' ? 'default' :
                                request.status === 'pending' ? 'secondary' : 'destructive'
                              }
                              className="shadow-sm"
                            >
                              {request.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                            {request.reason}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Performance Overview */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-900">Fleet Performance</CardTitle>
                    <CardDescription className="text-slate-600">
                      Real-time performance indicators
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Driver Utilization</span>
                    <span className="text-sm font-bold text-slate-900">
                      {stats.totalDrivers > 0 ? Math.round((stats.activeDrivers / stats.totalDrivers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.totalDrivers > 0 ? (stats.activeDrivers / stats.totalDrivers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Safety Score</span>
                    <span className="text-sm font-bold text-slate-900">
                      {stats.totalWarnings > 0 ? Math.max(0, Math.round(((stats.totalWarnings - stats.highSeverityWarnings) / stats.totalWarnings) * 100)) : 100}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.totalWarnings > 0 ? Math.max(0, ((stats.totalWarnings - stats.highSeverityWarnings) / stats.totalWarnings) * 100) : 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Fleet Health</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-700">Excellent</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-900">Quick Actions</CardTitle>
                    <CardDescription className="text-slate-600">
                      Common management tasks
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center space-y-2 p-4 h-auto border-slate-300 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    onClick={() => navigate('/drivers/add')}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Add Driver</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center space-y-2 p-4 h-auto border-slate-300 hover:border-orange-300 hover:bg-orange-50 transition-all group"
                    onClick={() => navigate('/warnings')}
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium">View Warnings</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center space-y-2 p-4 h-auto border-slate-300 hover:border-green-300 hover:bg-green-50 transition-all group"
                    onClick={() => navigate('/holiday-requests')}
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">View Holidays</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center space-y-2 p-4 h-auto border-slate-300 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                    onClick={() => navigate('/drivers')}
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">Manage Drivers</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Security Notice */}
          <div className="mt-12 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
            <div className="flex items-center justify-center gap-2 text-sm text-indigo-700">
              <Shield className="h-4 w-4" />
              <span>
                All data is encrypted and securely managed. Dashboard updates automatically every 30 seconds.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
