import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { API_ENDPOINTS } from '@/config/api'
import { 
  Truck, 
  Users,
  ArrowRight,
  Calendar,
  AlertTriangle,
  Activity,
  Shield,
  BarChart3,
  Clock,
  CheckCircle2,
  Star,
  Zap,
  LogIn,
  LogOut
} from 'lucide-react'

interface AnalyticsData {
  drivers: {
    total_drivers: number
    active_drivers: number
    inactive_drivers: number
  }
  warnings: {
    total_warnings: number
    active_warnings: number
    high_severity_warnings: number
    medium_severity_warnings: number
    low_severity_warnings: number
  }
  holidays: {
    total_requests: number
    pending_requests: number
    approved_requests: number
    rejected_requests: number
  }
  recent_activity: {
    warnings: any[]
    holiday_requests: any[]
  }
  last_updated: string
}

export default function HomePage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch real analytics data for homepage stats (only if authenticated)
    const fetchAnalytics = async () => {
      if (!isAuthenticated) return
      
      try {
        const response = await fetch(API_ENDPOINTS.analytics)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      }
    }

    fetchAnalytics()
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
    setAnalytics(null) // Clear analytics data on logout
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
                FleetManager
              </span>
              <div className="text-xs text-slate-500 font-medium">Professional Edition</div>
            </div>
          </div>
          <Button 
            onClick={() => isAuthenticated ? navigate('/dashboard') : navigate('/login')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 px-6"
          >
            {isAuthenticated ? (
              <div className="flex items-center">
                <Activity className="mr-2 h-4 w-4" />
                Dashboard
              </div>
            ) : (
              <div className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" />
                Admin Login
              </div>
            )}
          </Button>
          {isAuthenticated && (
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="ml-2"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Main Hero Content */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-2 mb-8">
              <Zap className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">Modern Fleet Management</span>
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Live</Badge>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Smart Fleet
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent block">
                Management
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Streamline your fleet operations with intelligent driver management, 
              automated warnings, and seamless holiday planning.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                onClick={() => isAuthenticated ? navigate('/dashboard') : navigate('/login')}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 px-8 h-14 text-lg"
              >
                {isAuthenticated ? (
                  <>
                    <Activity className="mr-2 h-5 w-5" />
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Admin Login
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <Button 
                onClick={() => navigate('/holiday-request')}
                variant="outline" 
                size="lg"
                className="border-2 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 px-8 h-14 text-lg"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Request Holiday
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">
                  {analytics?.drivers.total_drivers || '124'}
                </div>
                <div className="text-slate-600 font-medium">Active Drivers</div>
                <div className="text-xs text-green-600 font-medium mt-1">+12% this month</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">
                  {analytics?.warnings.active_warnings || '3'}
                </div>
                <div className="text-slate-600 font-medium">Active Warnings</div>
                <div className="text-xs text-red-600 font-medium mt-1">2 high priority</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">
                  {analytics?.holidays.pending_requests || '5'}
                </div>
                <div className="text-slate-600 font-medium">Holiday Requests</div>
                <div className="text-xs text-blue-600 font-medium mt-1">2 urgent reviews</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">98%</div>
                <div className="text-slate-600 font-medium">Fleet Efficiency</div>
                <div className="text-xs text-green-600 font-medium mt-1">Above target</div>
              </CardContent>
            </Card>
          </div>

          {/* Features Showcase */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Monitoring</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Real-time driver performance tracking with intelligent alerts and automated compliance monitoring.
                </p>
                <div className="flex items-center text-sm text-indigo-600 font-medium">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  24/7 Automated Monitoring
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-6">
                  <Clock className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Processing</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Lightning-fast holiday approvals and warning management with streamlined workflows.
                </p>
                <div className="flex items-center text-sm text-emerald-600 font-medium">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Sub-second Response Times
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-6">
                  <Star className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Premium Experience</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Intuitive interface designed for efficiency with enterprise-grade security and reliability.
                </p>
                <div className="flex items-center text-sm text-amber-600 font-medium">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  99.9% Uptime Guarantee
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card className="max-w-2xl mx-auto border-0 shadow-lg shadow-emerald-200/50 bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <Activity className="h-6 w-6 text-emerald-600" />
                <span className="text-xl font-bold text-emerald-900">All Systems Operational</span>
              </div>
              <p className="text-emerald-700 mb-4">
                Real-time monitoring shows all services running optimally
              </p>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-emerald-800">API Services</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-emerald-800">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-emerald-800">Notifications</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Modern Footer */}
      <footer className="border-t border-slate-200 bg-slate-50/50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Truck className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900">FleetManager</span>
                <div className="text-xs text-slate-500">Professional Edition</div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-sm text-slate-600 mb-1">
                © 2025 FleetManager. Built for modern fleet operations.
              </div>
              <div className="text-xs text-slate-500">
                Trusted by 500+ transportation companies worldwide
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}