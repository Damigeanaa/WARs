import MobileOptimizationStatus from '@/components/mobile/MobileOptimizationStatus'

export default function MobileOptimizationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mobile Optimization</h1>
          <p className="text-slate-600 mt-2">
            Phase 3.2 - Mobile optimization implementation status and device detection
          </p>
        </div>
      </div>

      <MobileOptimizationStatus />
    </div>
  )
}
