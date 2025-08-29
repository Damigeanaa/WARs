import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useMobile } from '@/hooks/useMobile'
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  TouchpadIcon as Touch,
  ScreenShare,
  Zap,
  CheckCircle2,
  Navigation
} from 'lucide-react'

export default function MobileOptimizationStatus() {
  const { isMobile, isTablet, isTouchDevice, screenSize } = useMobile()

  const optimizations = [
    {
      title: 'Navigation Sidebar',
      status: 'completed',
      description: 'Mobile-friendly hamburger menu with wider touch targets and swipe-to-close functionality',
      features: ['Larger touch targets (12x12 minimum)', 'Improved spacing for mobile', 'Auto-close on navigation', 'Enhanced backdrop overlay']
    },
    {
      title: 'Responsive Tables',
      status: 'completed', 
      description: 'Tables convert to card layouts on mobile devices for better readability',
      features: ['Card view on mobile/tablet', 'Table view on desktop', 'Touch-friendly action buttons', 'Optimized information hierarchy']
    },
    {
      title: 'Touch-Optimized Forms',
      status: 'completed',
      description: 'Form elements sized appropriately for touch interaction',
      features: ['Larger input fields on mobile', 'Full-width buttons on small screens', 'Better spacing and padding', 'Improved focus states']
    },
    {
      title: 'Grid Layouts',
      status: 'completed',
      description: 'Responsive grid systems that adapt to screen size',
      features: ['Single column on mobile', 'Progressive enhancement for larger screens', 'Optimized gap spacing', 'Better content flow']
    },
    {
      title: 'Mobile-First CSS',
      status: 'completed',
      description: 'Custom utility classes for mobile-optimized experiences',
      features: ['Touch target utilities', 'Safe area support for notched devices', 'Mobile-specific animations', 'Progressive text sizing']
    }
  ]

  const getDeviceIcon = () => {
    if (isMobile) return <Smartphone className="h-5 w-5 text-blue-600" />
    if (isTablet) return <Tablet className="h-5 w-5 text-green-600" />
    return <Monitor className="h-5 w-5 text-purple-600" />
  }

  const getDeviceType = () => {
    if (isMobile) return 'Mobile'
    if (isTablet) return 'Tablet'
    return 'Desktop'
  }

  return (
    <div className="space-y-6">
      {/* Current Device Detection */}
      <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <ScreenShare className="h-5 w-5 text-blue-600" />
            </div>
            Device Detection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              {getDeviceIcon()}
              <div>
                <p className="font-semibold text-slate-900">{getDeviceType()}</p>
                <p className="text-sm text-slate-600">Current device</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Touch className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-slate-900">{isTouchDevice ? 'Touch' : 'Mouse'}</p>
                <p className="text-sm text-slate-600">Input method</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Navigation className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="font-semibold text-slate-900">{screenSize.toUpperCase()}</p>
                <p className="text-sm text-slate-600">Screen size</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Zap className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-slate-900">Optimized</p>
                <p className="text-sm text-slate-600">UI state</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Status */}
      <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            Mobile Optimization Status
          </CardTitle>
          <p className="text-slate-600">Phase 3.2 - Mobile Optimization Implementation</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizations.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    ✅ {item.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">{item.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-0 shadow-xl shadow-slate-200/50 bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Next Recommended Optimizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-800">Add swipe gestures for card interactions</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-800">Implement pull-to-refresh functionality</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-800">Add mobile-specific loading states</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-800">Optimize image loading for mobile networks</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
