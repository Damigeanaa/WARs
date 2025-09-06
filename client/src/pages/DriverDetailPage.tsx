import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DriverTimeline from '@/components/driver/DriverTimeline'
import ImageUpload from '@/components/common/ImageUpload'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Edit, 
  Settings,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Star,
  Truck,
  BarChart3,
  Download,
  Share2,
  Activity,
  Target
} from 'lucide-react'

interface Driver {
  id: number
  driver_id: string
  name: string
  email: string
  phone: string
  license_number: string
  status: 'Active' | 'Inactive' | 'On Holiday'
  join_date: string
  profile_picture?: string
  current_address?: string
  employment_type?: 'Fulltime' | 'Minijob'
  annual_vacation_days?: number
  used_vacation_days?: number
  created_at?: string
  updated_at?: string
}

interface PerformanceMetric {
  id: number
  driver_id: number
  week: string
  delivered_packages: number
  packages_dnr: number
  dnr_dpmo: number
  dispatched_packages: number
  packages_rts: number
  rts_percentage: number
  rts_dpmo: number
  dcr_percentage: number
  lor_dpmo: number
  pod_percentage: number
  cc_percentage: number
  ce_percentage: number
  cdf_percentage: number
  created_at: string
}

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: driver, isLoading, error } = useQuery({
    queryKey: ['driver', id],
    queryFn: async (): Promise<Driver> => {
      const response = await fetch(`http://localhost:3001/api/drivers/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch driver')
      }
      return response.json()
    },
    enabled: !!id
  })

  // Fetch performance metrics for this driver
  const { data: performanceMetrics = [] } = useQuery({
    queryKey: ['performance-metrics', id],
    queryFn: async (): Promise<PerformanceMetric[]> => {
      const response = await fetch(`http://localhost:3001/api/performance-metrics/driver/${id}`)
      if (!response.ok) {
        return []
      }
      return response.json()
    },
    enabled: !!id
  })

  // Handle progress bar animation
  useEffect(() => {
    const progressBar = document.querySelector('.progress-bar[data-pct]') as HTMLElement
    if (progressBar) {
      const pct = progressBar.getAttribute('data-pct')
      if (pct) {
        progressBar.style.setProperty('--progress-width', `${pct}%`)
        // Trigger animation after a small delay
        setTimeout(() => {
          progressBar.style.width = `${pct}%`
        }, 100)
      }
    }
  }, [driver, activeTab])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'On Holiday':
        return 'bg-blue-100 text-blue-800'
      case 'Inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !driver) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Driver Not Found</h1>
          <p className="text-gray-600 mb-6">The requested driver could not be found.</p>
          <Button onClick={() => navigate('/drivers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto py-6 space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/drivers')} className="hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Drivers
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Driver Profile</h1>
                <p className="text-slate-600">Comprehensive driver information and performance tracking</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="hover:bg-slate-50">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="hover:bg-slate-50">
                <Share2 className="h-4 w-4 mr-2" />
                Share Profile
              </Button>
              <Button 
                onClick={() => navigate(`/drivers/${driver.id}/edit`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Driver
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Driver Header Card */}
        <Card className="shadow-lg border-slate-200">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={driver.profile_picture ? `http://localhost:3001${driver.profile_picture}` : undefined}
                      alt={`${driver.name}'s profile`} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                      {getInitials(driver.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${
                    driver.status === 'Active' ? 'bg-green-500' : 
                    driver.status === 'On Holiday' ? 'bg-blue-500' : 'bg-red-500'
                  }`} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{driver.name}</h2>
                  <p className="text-slate-600 text-lg">{driver.email}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge className={`${getStatusColor(driver.status)} px-3 py-1`}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {driver.status}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      <CreditCard className="w-3 h-3 mr-1" />
                      {driver.driver_id || `DRV-${new Date().getFullYear()}-${driver.id.toString().padStart(4, '0')}`}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Stats Grid */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">
                    {(driver.annual_vacation_days || 25) - (driver.used_vacation_days || 0)}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">Vacation Days Left</div>
                  <Clock className="w-4 h-4 mx-auto mt-1 text-blue-500" />
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center border border-green-200">
                  <div className="text-3xl font-bold text-green-600">
                    {driver.employment_type === 'Fulltime' ? 'Full' : 'Mini'}
                  </div>
                  <div className="text-sm text-green-700 font-medium">Employment Type</div>
                  <Truck className="w-4 h-4 mx-auto mt-1 text-green-500" />
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600">
                    {new Date().getFullYear() - new Date(driver.join_date).getFullYear()}
                  </div>
                  <div className="text-sm text-purple-700 font-medium">Years with Company</div>
                  <Award className="w-4 h-4 mx-auto mt-1 text-purple-500" />
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl text-center border border-amber-200">
                  <div className="text-3xl font-bold text-amber-600">
                    <Star className="w-8 h-8 mx-auto" />
                  </div>
                  <div className="text-sm text-amber-700 font-medium">Performance Rating</div>
                  <div className="text-xs text-amber-600">Excellent</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm border border-slate-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Personal Information */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <span className="text-sm text-slate-600">Email Address</span>
                      <div className="font-medium text-slate-900">{driver.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <span className="text-sm text-slate-600">Phone Number</span>
                      <div className="font-medium text-slate-900">{driver.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    <div className="flex-1">
                      <span className="text-sm text-slate-600">License Number</span>
                      <div className="font-medium text-slate-900 font-mono">{driver.license_number}</div>
                    </div>
                  </div>
                  {driver.current_address && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-red-600" />
                      <div className="flex-1">
                        <span className="text-sm text-slate-600">Current Address</span>
                        <div className="font-medium text-slate-900">{driver.current_address}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    <div className="flex-1">
                      <span className="text-sm text-slate-600">Join Date</span>
                      <div className="font-medium text-slate-900">
                        {new Date(driver.join_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Employment Details */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Employment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-700 font-medium">Employment Type</span>
                      <Badge variant="outline" className="bg-white border-green-200 text-green-700">
                        {driver.employment_type || 'Fulltime'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-blue-700 font-medium">Annual Vacation Days</span>
                      <span className="font-bold text-blue-800">{driver.annual_vacation_days || 25}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm text-amber-700 font-medium">Used Vacation Days</span>
                      <span className="font-bold text-amber-800">{driver.used_vacation_days || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <span className="text-sm text-emerald-700 font-medium">Remaining Days</span>
                      <span className="font-bold text-emerald-800">
                        {(driver.annual_vacation_days || 25) - (driver.used_vacation_days || 0)} days
                      </span>
                    </div>
                  </div>
                  
                  {/* Enhanced Vacation Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Vacation Usage Progress</span>
                      <span className="text-sm text-slate-600">
                        {Math.round(((driver.used_vacation_days || 0) / (driver.annual_vacation_days || 25)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="progress-bar bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                        data-pct={Math.min(((driver.used_vacation_days || 0) / (driver.annual_vacation_days || 25)) * 100, 100)}
                      />
                    </div>
                    <div className="text-xs text-slate-500 text-center">
                      Track vacation day usage throughout the year
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Metrics */}
              <Card className="lg:col-span-2 shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Metrics
                    {performanceMetrics.length > 0 && (
                      <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
                        {performanceMetrics.length} weeks
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {performanceMetrics.length > 0 ? (
                    <div className="space-y-6">
                      {/* Latest Week Summary */}
                      {(() => {
                        const latest = performanceMetrics[0]
                        return (
                          <div>
                            <h3 className="text-lg font-semibold mb-6">Latest Performance - Week {latest.week}</h3>
                            
                            {/* Main metrics - larger cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-sm">
                                <div className="text-3xl font-bold text-blue-600 mb-1">{latest.delivered_packages.toLocaleString()}</div>
                                <div className="text-sm text-blue-700 font-medium">Delivered</div>
                              </div>
                              
                              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-sm">
                                <div className="text-3xl font-bold text-green-600 mb-1">{latest.dcr_percentage?.toFixed(1) || 'N/A'}%</div>
                                <div className="text-sm text-green-700 font-medium">DCR</div>
                              </div>
                              
                              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 shadow-sm">
                                <div className="text-3xl font-bold text-orange-600 mb-1">{latest.dnr_dpmo?.toLocaleString() || 'N/A'}</div>
                                <div className="text-sm text-orange-700 font-medium">DNR DPMO</div>
                              </div>
                              
                              <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 shadow-sm">
                                <div className="text-3xl font-bold text-red-600 mb-1">{latest.lor_dpmo?.toLocaleString() || 'N/A'}</div>
                                <div className="text-sm text-red-700 font-medium">LoR DPMO</div>
                              </div>
                            </div>
                            
                            {/* Secondary metrics - smaller cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                <div className="text-2xl font-bold text-purple-600 mb-1">{latest.pod_percentage?.toFixed(1) || 'N/A'}%</div>
                                <div className="text-xs text-purple-700 font-medium">POD</div>
                              </div>
                              
                              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                                <div className="text-2xl font-bold text-indigo-600 mb-1">{latest.cc_percentage?.toFixed(1) || 'N/A'}%</div>
                                <div className="text-xs text-indigo-700 font-medium">CC</div>
                              </div>
                              
                              <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                                <div className="text-2xl font-bold text-teal-600 mb-1">{latest.ce_percentage?.toFixed(0) || 'N/A'}</div>
                                <div className="text-xs text-teal-700 font-medium">CE</div>
                              </div>
                              
                              <div className="text-center p-4 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl border border-rose-200">
                                <div className="text-2xl font-bold text-rose-600 mb-1">{latest.cdf_percentage?.toFixed(1) || 'N/A'}%</div>
                                <div className="text-xs text-rose-700 font-medium">CDF</div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Performance History */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Performance History</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DCR %</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNR DPMO</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LoR DPMO</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">POD %</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CC %</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CE %</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CDF %</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {performanceMetrics.slice(0, 10).map((metric) => (
                                <tr key={metric.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Week {metric.week}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{metric.delivered_packages.toLocaleString()}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{metric.dcr_percentage?.toFixed(1) || 'N/A'}%</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{metric.dnr_dpmo.toLocaleString()}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{metric.lor_dpmo?.toLocaleString() || 'N/A'}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{metric.pod_percentage?.toFixed(1) || 'N/A'}%</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{metric.cc_percentage?.toFixed(1) || 'N/A'}%</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{metric.ce_percentage?.toFixed(1) || 'N/A'}%</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{metric.cdf_percentage?.toFixed(1) || 'N/A'}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                      <h3 className="text-lg font-medium text-slate-600 mb-2">No Performance Data Available</h3>
                      <p className="text-slate-500">Performance metrics will appear here once data is imported.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Goals */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goals & Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {performanceMetrics.length > 0 ? (
                    <>
                      {(() => {
                        const avgDelivered = performanceMetrics.reduce((sum, m) => sum + m.delivered_packages, 0) / performanceMetrics.length
                        const avgRTS = performanceMetrics.reduce((sum, m) => sum + m.rts_percentage, 0) / performanceMetrics.length
                        const avgDNR = performanceMetrics.reduce((sum, m) => sum + m.packages_dnr, 0) / performanceMetrics.length
                        
                        return (
                          <>
                            <div className="flex items-center gap-3">
                              {avgDelivered > 500 ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Clock className="w-5 h-5 text-amber-500" />
                              )}
                              <span className="text-sm">High Volume Deliverer ({avgDelivered.toFixed(0)} avg)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {avgRTS < 2 ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Clock className="w-5 h-5 text-amber-500" />
                              )}
                              <span className="text-sm">Low RTS Rate ({avgRTS.toFixed(2)}% avg)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {avgDNR < 3 ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Clock className="w-5 h-5 text-amber-500" />
                              )}
                              <span className="text-sm">Low DNR Rate ({avgDNR.toFixed(1)} avg)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Star className="w-5 h-5 text-amber-500" />
                              <span className="text-sm">Consistent Performer</span>
                            </div>
                          </>
                        )
                      })()}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <span className="text-sm">Awaiting Performance Data</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">Ready for Goals Setup</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <DriverTimeline driverId={driver.id} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Profile Picture */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-8">
                  <ImageUpload
                    currentImage={driver.profile_picture}
                    driverId={driver.id}
                    driverName={driver.name}
                    size="lg"
                    className="mb-4"
                  />
                </CardContent>
              </Card>

              {/* Enhanced Record Information */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg">
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {driver.created_at && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-slate-600" />
                      <div className="flex-1">
                        <span className="text-sm text-slate-600">Record Created</span>
                        <div className="font-medium text-slate-900">
                          {new Date(driver.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {driver.updated_at && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Clock className="h-4 w-4 text-slate-600" />
                      <div className="flex-1">
                        <span className="text-sm text-slate-600">Last Updated</span>
                        <div className="font-medium text-slate-900">
                          {new Date(driver.updated_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <CreditCard className="h-4 w-4 text-slate-600" />
                    <div className="flex-1">
                      <span className="text-sm text-slate-600">System ID</span>
                      <div className="font-medium text-slate-900 font-mono">
                        {driver.driver_id || `DRV-${new Date().getFullYear()}-${driver.id.toString().padStart(4, '0')}`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
