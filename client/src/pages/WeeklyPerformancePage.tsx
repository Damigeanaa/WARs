import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Database, 
  CheckCircle, 
  X, 
  Upload, 
  Calendar, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  Plus,
  BarChart3,
  Users,
  TrendingUp,
  Settings
} from 'lucide-react'

interface WeekData {
  week: string
  driver_count: number
  imported_at: string
  last_updated: string
}

export default function WeeklyPerformancePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'import' | 'manage'>('import')
  const [week, setWeek] = useState('')
  const [performanceData, setPerformanceData] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [existingWeeks, setExistingWeeks] = useState<WeekData[]>([])
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(false)
  const { toast } = useToast()

  // Get current week number
  const getCurrentWeek = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    const oneWeek = 1000 * 60 * 60 * 24 * 7
    return Math.ceil(diff / oneWeek)
  }

  React.useEffect(() => {
    setWeek(getCurrentWeek().toString())
    loadExistingWeeks()
  }, [])

  const loadExistingWeeks = async () => {
    setIsLoadingWeeks(true)
    try {
      const response = await fetch('/api/performance-metrics/weeks')
      if (response.ok) {
        const weeks = await response.json()
        setExistingWeeks(weeks)
      }
    } catch (error) {
      console.error('Error loading existing weeks:', error)
    } finally {
      setIsLoadingWeeks(false)
    }
  }

  const handleDeleteWeek = async (weekToDelete: string) => {
    if (!confirm(t('performance.confirmDeleteWeek', { week: weekToDelete }))) {
      return
    }

    try {
      const response = await fetch(`/api/performance-metrics/week/${weekToDelete}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: t('performance.deleteSuccess'),
          description: result.message,
          variant: "default"
        })
        
        // Reload the weeks list
        loadExistingWeeks()
        
        // Clear results if it was for the deleted week
        if (results && results.week === weekToDelete) {
          setResults(null)
        }
      } else {
        toast({
          title: t('performance.deleteFailed'),
          description: result.error || t('common.unknownError'),
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting week:', error)
      toast({
        title: t('performance.deleteFailed'),
        description: t('common.networkError'),
        variant: "destructive"
      })
    }
  }

  const dataTemplate = `A970NL7W6Y5CS 913 99.67% 1095 0 98.62% 100% 0 72.35%
A9MF7F9M3ZIZR 314 99.68% 0 0 100% 100% 0 90.07%
ACBZ85FMWDKAA 300 99.01% 3333 0 100% - 0 59.72%
AE4CEMB80WD3D 801 98.77% 2497 0 93.36% 72.73% 0 77.26%
AE051D11QT12D 332 100% 3012 0 98.33% - 0 -`

  const handleImport = async () => {
    if (!performanceData.trim()) {
      toast({
        title: t('performance.dataRequired'),
        description: t('performance.enterPerformanceData'),
        variant: "destructive"
      })
      return
    }

    if (!week.trim()) {
      toast({
        title: t('performance.weekRequired'),
        description: t('performance.enterWeekNumber'),
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    setResults(null)

    try {
      const response = await fetch('/api/performance-metrics/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData: performanceData,
          week: week,
          type: 'extended'
        }),
      })

      const result = await response.json()
      setResults(result)

      if (result.success) {
        toast({
          title: t('performance.importSuccess'),
          description: result.message,
          variant: "default"
        })
        
        // Clear form after successful import
        setPerformanceData('')
        
        // Reload the weeks list
        loadExistingWeeks()
      } else {
        toast({
          title: t('performance.importFailed'),
          description: result.error || t('common.unknownError'),
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error importing performance data:', error)
      toast({
        title: t('performance.importFailed'), 
        description: t('common.networkError'),
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatErrors = (errors: string[]) => {
    if (!errors || errors.length === 0) return null
    
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <h4 className="text-sm font-medium text-red-800 mb-2">{t('performance.errors')}:</h4>
        <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
          {errors.slice(0, 10).map((error, index) => (
            <li key={index}>{error}</li>
          ))}
          {errors.length > 10 && (
            <li className="text-red-600">{t('performance.moreErrors', { count: errors.length - 10 })}</li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/drivers')}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white border-white/30"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('performance.backToDrivers')}
            </Button>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{t('performance.title')}</h1>
                    <p className="text-blue-100 font-medium">{t('performance.description')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/20">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('performance.currentWeek')}: {getCurrentWeek()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab('import')}
                className={`flex items-center gap-2 px-6 py-4 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'import'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-[1.02]'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/70'
                }`}
              >
                <Plus className="w-4 h-4" />
                {t('performance.importData')}
              </button>
              <button
                onClick={() => {
                  setActiveTab('manage')
                  if (existingWeeks.length === 0 && !isLoadingWeeks) {
                    loadExistingWeeks()
                  }
                }}
                className={`flex items-center gap-2 px-6 py-4 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'manage'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-[1.02]'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/70'
                }`}
              >
                <Settings className="w-4 h-4" />
                {t('performance.manageData')}
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'import' ? (
          <ImportDataSection 
            week={week}
            setWeek={setWeek}
            performanceData={performanceData}
            setPerformanceData={setPerformanceData}
            isUploading={isUploading}
            results={results}
            handleImport={handleImport}
            formatErrors={formatErrors}
            dataTemplate={dataTemplate}
            t={t}
          />
        ) : (
          <ManageDataSection
            existingWeeks={existingWeeks}
            isLoadingWeeks={isLoadingWeeks}
            handleDeleteWeek={handleDeleteWeek}
            navigate={navigate}
            t={t}
          />
        )}
      </div>
    </div>
  )
}

// Import Data Section Component
function ImportDataSection({ 
  week, 
  setWeek, 
  performanceData, 
  setPerformanceData, 
  isUploading, 
  results, 
  handleImport, 
  formatErrors, 
  dataTemplate, 
  t 
}: any) {
  return (
    <div className="grid grid-cols-1 2xl:grid-cols-4 xl:grid-cols-3 gap-8">
      {/* Main Import Form */}
      <div className="2xl:col-span-3 xl:col-span-2">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Database className="w-5 h-5 text-white" />
              </div>
              {t('performance.importData')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Week Selection */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-blue-200/30">
              <div className="flex items-center gap-4">
                <Label htmlFor="week" className="text-sm font-semibold text-gray-700 min-w-[60px]">
                  {t('performance.week')}
                </Label>
                <Input
                  id="week"
                  type="number"
                  min="1"
                  max="53"
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  className="w-32 border-blue-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80"
                  placeholder="1-53"
                />
              </div>
            </div>

            {/* Data Input Section */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="performance-data" className="text-lg font-semibold text-gray-800 mb-3 block">
                  {t('performance.dataFormat')}
                </Label>
                <p className="text-gray-600 mb-4 font-medium">
                  {t('performance.dataFormatDescription')}
                </p>
              </div>
              
              <Textarea
                id="performance-data"
                placeholder={dataTemplate}
                value={performanceData}
                onChange={(e) => setPerformanceData(e.target.value)}
                className="min-h-[320px] font-mono text-sm border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500 bg-white/80"
              />
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">{t('performance.expectedFormat')}:</p>
                <code className="text-xs text-blue-700 bg-blue-100/80 px-3 py-2 rounded-lg font-mono block">
                  {t('performance.formatExample')}
                </code>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleImport}
              disabled={isUploading || !performanceData.trim() || !week.trim()}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  {t('performance.importing')}
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-3" />
                  {t('performance.importButton')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Guide */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('performance.instructions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span className="text-gray-700 font-medium">{t('performance.step1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span className="text-gray-700 font-medium">{t('performance.step2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span className="text-gray-700 font-medium">{t('performance.step3')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                <span className="text-gray-700 font-medium">{t('performance.step4')}</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Metrics Info */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('performance.metricsIncluded')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[
                { key: 'Delivered', desc: t('performance.delivered') },
                { key: 'DCR', desc: t('performance.dcr') },
                { key: 'DNR DPMO', desc: t('performance.dnrDpmo') },
                { key: 'LoR DPMO', desc: t('performance.lorDpmo') },
                { key: 'POD', desc: t('performance.pod') },
                { key: 'CC', desc: t('performance.cc') },
                { key: 'CE', desc: t('performance.ce') },
                { key: 'CDF', desc: t('performance.cdf') }
              ].map((metric, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50/80 transition-colors">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                  <span className="font-semibold text-gray-800 min-w-[80px]">{metric.key}:</span>
                  <span className="text-gray-600 text-sm">{metric.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className={`${
              results.success 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
            }`}>
              <CardTitle className="flex items-center gap-2">
                {results.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
                {t('performance.importResults')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                    <span className="font-medium text-gray-700">{t('performance.processed')}:</span>
                    <span className="font-bold text-gray-900">{results.processed}</span>
                  </div>
                  {results.imported !== undefined && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <span className="font-medium text-green-700">{t('performance.imported')}:</span>
                      <span className="font-bold text-green-800">{results.imported}</span>
                    </div>
                  )}
                  {results.updated !== undefined && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <span className="font-medium text-blue-700">{t('performance.updated')}:</span>
                      <span className="font-bold text-blue-800">{results.updated}</span>
                    </div>
                  )}
                </div>
                
                {results.message && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">{results.message}</p>
                  </div>
                )}

                {results.errors && formatErrors(results.errors)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Manage Data Section Component
function ManageDataSection({ existingWeeks, isLoadingWeeks, handleDeleteWeek, navigate, t }: any) {
  return (
    <div className="max-w-7xl mx-auto">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Database className="w-5 h-5 text-white" />
            </div>
            {t('performance.existingData')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {isLoadingWeeks ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">{t('performance.loadingWeeks')}</p>
              </div>
            </div>
          ) : existingWeeks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('performance.noExistingData')}</h3>
              <p className="text-gray-600">Importează primul set de date pentru a începe</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-8">
                {existingWeeks.map((weekData: WeekData) => (
                  <div key={weekData.week} className="bg-gradient-to-br from-white to-blue-50/50 border border-blue-200/50 rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {t('performance.week')} {weekData.week}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 font-medium">
                              {weekData.driver_count} {t('performance.drivers')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 bg-gray-100/80 rounded-lg px-3 py-2">
                        {t('performance.importedAt')}: {new Date(weekData.imported_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/drivers?week=${weekData.week}`)}
                        className="flex-1 flex items-center gap-2 hover:bg-blue-50 border-blue-200 text-blue-600 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        {t('performance.view')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWeek(weekData.week)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('performance.delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">{t('performance.deleteWarning')}</h4>
                    <p className="text-sm text-yellow-700">{t('performance.deleteWarningText')}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
