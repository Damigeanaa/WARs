import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import NotificationBell from '@/components/notifications/NotificationBell'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Calendar,
  Menu,
  X,
  Truck,
  Tags,
  FileText,
  Home,
  Clock,
  Shield,
  LogOut,
  User,
  Settings,
  Timer,
} from 'lucide-react'

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'main' },
]

const coreManagementNavigation = [
  { name: 'Drivers', href: '/drivers', icon: Users, section: 'core' },
  { name: 'Warnings', href: '/warnings', icon: AlertTriangle, section: 'core' },
  { name: 'Holidays', href: '/holiday-requests', icon: Calendar, section: 'core' },
]

const schedulingNavigation = [
  { name: 'Schedule Planner', href: '/schedule-planner', icon: Clock, section: 'scheduling' },
]

const scheduleSubmenu = [
  { name: 'Schedule Planner', href: '/schedule-planner', icon: Clock },
  { name: 'Schedule Settings', href: '/schedule-settings', icon: Settings },
]

const warningSubmenu = [
  { name: 'All Warnings', href: '/warnings', icon: AlertTriangle },
  { name: 'Categories', href: '/warning-categories', icon: Tags },
  { name: 'Templates', href: '/warning-templates', icon: FileText },
]

const systemNavigation = [
  { name: 'TimeSheet Mobile', href: '/timesheet-integration', icon: Timer, section: 'system' },
  { name: 'Project Settings', href: '/project-settings', icon: Settings, section: 'system' },
  { name: 'Audit Logs', href: '/audit-logs', icon: Shield, section: 'system' },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [warningsExpanded, setWarningsExpanded] = useState(
    location.pathname.startsWith('/warning')
  )
  const [scheduleExpanded, setScheduleExpanded] = useState(
    location.pathname.startsWith('/schedule')
  )

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logged out successfully",
        description: "You have been securely logged out.",
      })
      navigate('/')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when navigating on mobile
  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white/95 backdrop-blur-xl border-r border-slate-200/60 shadow-xl transform transition-all duration-300 ease-in-out",
        isMobile ? "w-80" : "w-64", // Wider on mobile for better touch targets
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        !isMobile && "lg:translate-x-0"
      )}>
        <div className={cn(
          "flex items-center justify-between border-b border-slate-200/60",
          isMobile ? "h-20 px-6" : "h-16 px-6" // Taller header on mobile
        )}>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={cn(
                "bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg",
                isMobile ? "w-10 h-10" : "w-8 h-8" // Larger logo on mobile
              )}>
                <Truck className={cn("text-white", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
            </div>
            <span className={cn(
              "font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent",
              isMobile ? "text-xl" : "text-lg"
            )}>DriverManager</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "lg:hidden",
              isMobile && "h-12 w-12" // Larger close button on mobile
            )}
          >
            <X className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
          </Button>
        </div>
        
        <nav className={cn("px-4", isMobile ? "mt-8" : "mt-6")}>
          {/* Main Section */}
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">Main</h2>
          </div>
          <ul className="space-y-1">
            {mainNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isMobile ? "px-4 py-4" : "px-4 py-2.5",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
                    <span className={cn(isMobile && "text-base")}>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Core Management Section */}
          <div className={cn("mb-4", isMobile ? "mt-8" : "mt-6")}>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">Management</h2>
          </div>
          <ul className="space-y-1">
            {coreManagementNavigation.map((item) => {
              const isActive = location.pathname === item.href
              const isWarningsSection = item.name === 'Warnings'
              const isWarningsActive = location.pathname.startsWith('/warning')
              
              if (isWarningsSection) {
                return (
                  <li key={item.name}>
                    <div className="space-y-1">
                      <button
                        onClick={() => setWarningsExpanded(!warningsExpanded)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-lg text-sm font-medium transition-all duration-200",
                          isMobile ? "px-4 py-4" : "px-4 py-2.5",
                          isWarningsActive
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
                          <span className={cn(isMobile && "text-base")}>{item.name}</span>
                        </div>
                        <svg 
                          className={cn("transition-transform", 
                            warningsExpanded ? "rotate-90" : "",
                            isMobile ? "h-5 w-5" : "h-4 w-4"
                          )}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {warningsExpanded && (
                        <ul className={cn("space-y-1", isMobile ? "ml-8" : "ml-6")}>
                          {warningSubmenu.map((subItem) => {
                            const isSubActive = location.pathname === subItem.href
                            return (
                              <li key={subItem.name}>
                                <Link
                                  to={subItem.href}
                                  className={cn(
                                    "flex items-center space-x-3 rounded-lg text-sm font-medium transition-all duration-200",
                                    isMobile ? "px-4 py-3" : "px-4 py-2",
                                    isSubActive
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                  )}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <subItem.icon className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                                  <span className={cn(isMobile && "text-sm")}>{subItem.name}</span>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                )
              }
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isMobile ? "px-4 py-4" : "px-4 py-2.5",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
                    <span className={cn(isMobile && "text-base")}>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Scheduling Section */}
          <div className={cn("mb-4", isMobile ? "mt-8" : "mt-6")}>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">Scheduling</h2>
          </div>
          <ul className="space-y-1">
            {schedulingNavigation.map((item) => {
              const isActive = location.pathname === item.href
              const isScheduleSection = item.name === 'Schedule Planner'
              const isScheduleActive = location.pathname.startsWith('/schedule')
              
              if (isScheduleSection) {
                return (
                  <li key={item.name}>
                    <div className="space-y-1">
                      <button
                        onClick={() => setScheduleExpanded(!scheduleExpanded)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-lg text-sm font-medium transition-all duration-200",
                          isMobile ? "px-4 py-4" : "px-4 py-2.5",
                          isScheduleActive
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
                          <span className={cn(isMobile && "text-base")}>{item.name}</span>
                        </div>
                        <svg 
                          className={cn("transition-transform", 
                            scheduleExpanded ? "rotate-90" : "",
                            isMobile ? "h-5 w-5" : "h-4 w-4"
                          )}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {scheduleExpanded && (
                        <ul className={cn("space-y-1", isMobile ? "ml-8" : "ml-6")}>
                          {scheduleSubmenu.map((subItem) => {
                            const isSubActive = location.pathname === subItem.href
                            return (
                              <li key={subItem.name}>
                                <Link
                                  to={subItem.href}
                                  className={cn(
                                    "flex items-center space-x-3 rounded-lg text-sm font-medium transition-all duration-200",
                                    isMobile ? "px-4 py-3" : "px-4 py-2",
                                    isSubActive
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                  )}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <subItem.icon className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                                  <span className={cn(isMobile && "text-sm")}>{subItem.name}</span>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                )
              }
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isMobile ? "px-4 py-4" : "px-4 py-2.5",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
                    <span className={cn(isMobile && "text-base")}>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          
          {/* System Navigation */}
          <div className={cn("mb-4", isMobile ? "mt-8" : "mt-6")}>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">System</h2>
          </div>
          <ul className="space-y-1">
            {systemNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isMobile ? "px-4 py-4" : "px-4 py-2.5",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
                    <span className={cn(isMobile && "text-base")}>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">Main</h2>
          </div>
          <ul className="space-y-1">
            {mainNavigation.map((item) => {
              const isActive = location.pathname === item.href
              const isWarningsSection = item.name === 'Warnings'
              const isWarningsActive = location.pathname.startsWith('/warning')
              const isScheduleSection = item.name === 'Schedule Planner'
              const isScheduleActive = location.pathname.startsWith('/schedule')
              
              if (isWarningsSection) {
                return (
                  <li key={item.name}>
                    <div className="space-y-1">
                      <button
                        onClick={() => setWarningsExpanded(!warningsExpanded)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-lg text-sm font-medium transition-all duration-200",
                          isMobile ? "px-4 py-4" : "px-4 py-2.5", // Larger touch targets on mobile
                          isWarningsActive
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100" // Added active state for mobile
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
                          <span className={cn(isMobile && "text-base")}>{item.name}</span>
                        </div>
                        <svg 
                          className={cn("transition-transform", 
                            warningsExpanded ? "rotate-90" : "",
                            isMobile ? "h-5 w-5" : "h-4 w-4"
                          )}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {warningsExpanded && (
                        <ul className={cn("space-y-1", isMobile ? "ml-8" : "ml-6")}>
                          {warningSubmenu.map((subItem) => {
                            const isSubActive = location.pathname === subItem.href
                            return (
                              <li key={subItem.name}>
                                <Link
                                  to={subItem.href}
                                  className={cn(
                                    "flex items-center space-x-3 rounded-lg text-sm transition-all duration-200",
                                    isMobile ? "px-4 py-3" : "px-4 py-2", // Larger touch targets
                                    isSubActive
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                                  )}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <subItem.icon className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                                  <span className={cn(isMobile && "text-base")}>{subItem.name}</span>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                )
              }
              
              if (isScheduleSection) {
                return (
                  <li key={item.name}>
                    <div className="space-y-1">
                      <button
                        onClick={() => setScheduleExpanded(!scheduleExpanded)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-lg text-sm font-medium transition-all duration-200",
                          isMobile ? "px-4 py-4" : "px-4 py-2.5",
                          isScheduleActive
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
                          <span className={cn(isMobile && "text-base")}>{item.name}</span>
                        </div>
                        <svg 
                          className={cn("transition-transform", 
                            scheduleExpanded ? "rotate-90" : "",
                            isMobile ? "h-5 w-5" : "h-4 w-4"
                          )}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {scheduleExpanded && (
                        <ul className={cn("space-y-1", isMobile ? "ml-8" : "ml-6")}>
                          {scheduleSubmenu.map((subItem) => {
                            const isSubActive = location.pathname === subItem.href
                            return (
                              <li key={subItem.name}>
                                <Link
                                  to={subItem.href}
                                  className={cn(
                                    "flex items-center space-x-3 rounded-lg text-sm transition-all duration-200",
                                    isMobile ? "px-4 py-3" : "px-4 py-2",
                                    isSubActive
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                                  )}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <subItem.icon className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                                  <span className={cn(isMobile && "text-base")}>{subItem.name}</span>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                )
              }
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isMobile ? "px-4 py-4" : "px-4 py-2.5", // Larger touch targets on mobile
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
                    <span className={cn(isMobile && "text-base")}>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          
          {/* System Navigation */}
          <div className={cn("mb-4", isMobile ? "mt-10" : "mt-8")}>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">System</h2>
          </div>
          <ul className="space-y-1">
            {systemNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isMobile ? "px-4 py-4" : "px-4 py-2.5", // Larger touch targets on mobile
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
                    <span className={cn(isMobile && "text-base")}>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={() => setSidebarOpen(false)} // Better mobile touch handling
        />
      )}

      {/* Main content */}
      <div className={cn(isMobile ? "" : "lg:ml-64")}>
        {/* Header */}
        <header className={cn(
          "bg-white/95 backdrop-blur-xl border-b border-slate-200/60 flex items-center sticky top-0 z-30",
          isMobile ? "h-20 px-4" : "h-16 px-6" // Taller and adjusted padding on mobile
        )}>
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className={cn(
                "lg:hidden",
                isMobile && "h-12 w-12" // Larger hamburger button on mobile
              )}
            >
              <Menu className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
            </Button>
            
            {/* Spacer for mobile - pushes content to right */}
            <div className="flex-1 lg:flex-none"></div>
            
            <div className="flex items-center space-x-2 lg:space-x-4 ml-auto">
              {location.pathname === '/dashboard' && !isMobile && (
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border">
                  <Clock className="h-4 w-4" />
                  <span>Live updates enabled</span>
                </div>
              )}
              
              {/* Authentication UI */}
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="hidden lg:flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border">
                    <User className="h-4 w-4" />
                    <span>Admin: {user?.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size={isMobile ? "default" : "sm"}
                    asChild
                    className={cn(
                      "border-2 border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800",
                      isMobile && "h-12 px-4"
                    )}
                  >
                    <Link to="/profile">
                      <User className={cn("text-indigo-600", isMobile ? "mr-3 h-5 w-5" : "mr-2 h-4 w-4")} />
                      <span className={cn(isMobile ? "text-base" : "text-sm")}>Profile</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size={isMobile ? "default" : "sm"}
                    onClick={handleLogout}
                    className={cn(
                      "border-2 border-red-300 hover:border-red-400 hover:bg-red-50 text-red-700 hover:text-red-800",
                      isMobile && "h-12 px-4"
                    )}
                  >
                    <LogOut className={cn("text-red-600", isMobile ? "mr-3 h-5 w-5" : "mr-2 h-4 w-4")} />
                    <span className={cn(isMobile ? "text-base" : "text-sm")}>Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="hidden lg:block text-sm text-slate-600 font-medium">
                  Welcome! Today is {new Date().toLocaleDateString()}
                </div>
              )}
              
              <NotificationBell />
              <Button
                variant="outline"
                size={isMobile ? "default" : "sm"}
                asChild
                className={cn(
                  "border-2 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50",
                  isMobile && "h-12 px-4"
                )}
              >
                <Link to="/home">
                  <Home className={cn("text-slate-600", isMobile ? "mr-3 h-5 w-5" : "mr-2 h-4 w-4")} />
                  <span className={cn(isMobile ? "text-base" : "text-sm")}>Home</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={cn("p-4 lg:p-6", isMobile && "pb-safe")}>
          {children}
        </main>
      </div>
    </div>
  )
}
