import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, AlertCircle, CheckCircle, Download, X, Database, Clipboard } from 'lucide-react'

interface ImportPerformanceModalProps {
  isOpen: boolean
  onClose: () => void
}

type ImportType = 'extended' | 'concessions' | 'file'

export default function ImportPerformanceModal({ isOpen, onClose }: ImportPerformanceModalProps) {
  const [activeTab, setActiveTab] = useState<ImportType>('extended')
  const [extendedData, setExtendedData] = useState('')
  const [concessionsData, setConcessionsData] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const extendedTemplate = `driver_id,week,delivered_packages,packages_dnr,rts_percentage,dnr_dpmo,dcr_percentage,lor_dpmo,pod_percentage,cc_percentage,ce_percentage,cdf_percentage
1,1,850,15,1.76,176,98.24,150,95.5,92.3,88.7,94.2
1,2,920,12,1.30,130,98.70,120,96.2,93.1,89.4,95.1`

  const concessionsTemplate = `driver_id,week,concessions
1,1,15
1,2,12
2,1,22`

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'))
    
    if (csvFile) {
      setFile(csvFile)
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive"
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile)
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file.",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async () => {
    setIsUploading(true)
    setResults(null)

    try {
      let response
      const API_BASE_URL = 'http://localhost:3001/api'

      if (activeTab === 'file' && file) {
        // File upload
        const formData = new FormData()
        formData.append('file', file)
        
        response = await fetch(`${API_BASE_URL}/performance-metrics/import`, {
          method: 'POST',
          body: formData,
        })
      } else if (activeTab === 'extended' && extendedData.trim()) {
        // Extended performance data
        response = await fetch(`${API_BASE_URL}/performance-metrics/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            csvData: extendedData.trim(),
            type: 'extended'
          }),
        })
      } else if (activeTab === 'concessions' && concessionsData.trim()) {
        // Concessions data
        response = await fetch(`${API_BASE_URL}/performance-metrics/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            csvData: concessionsData.trim(),
            type: 'concessions'
          }),
        })
      } else {
        toast({
          title: "No data provided",
          description: "Please provide data to import.",
          variant: "destructive",
        })
        return
      }

      if (response?.ok) {
        const result = await response.json()
        setResults(result)
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.imported || result.processed} performance records.`,
        })
      } else {
        const error = await response?.json()
        throw new Error(error?.message || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setExtendedData('')
    setConcessionsData('')
    setFile(null)
    setResults(null)
    setActiveTab('extended')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Performance Data
          </DialogTitle>
          <DialogDescription>
            Choose how you want to import performance data: paste extended metrics, paste concessions only, or upload a CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('extended')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'extended'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Database className="w-4 h-4" />
              Extended Performance
            </button>
            <button
              onClick={() => setActiveTab('concessions')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'concessions'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clipboard className="w-4 h-4" />
              Concessions Only
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'file'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              CSV File Upload
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'extended' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="extended-data" className="text-sm font-medium">
                  Extended Performance Data (CSV Format)
                </Label>
                <p className="text-xs text-gray-500 mb-2">
                  Paste CSV data with all performance metrics including DCR, LoR DPMO, POD, CC, CE, CDF percentages
                </p>
                <Textarea
                  id="extended-data"
                  placeholder={extendedTemplate}
                  value={extendedData}
                  onChange={(e) => setExtendedData(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-2">Expected format:</p>
                <code className="text-xs text-blue-600 whitespace-pre-line">
                  driver_id,week,delivered_packages,packages_dnr,rts_percentage,dnr_dpmo,dcr_percentage,lor_dpmo,pod_percentage,cc_percentage,ce_percentage,cdf_percentage
                </code>
              </div>
            </div>
          )}

          {activeTab === 'concessions' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="concessions-data" className="text-sm font-medium">
                  Concessions Data (CSV Format)
                </Label>
                <p className="text-xs text-gray-500 mb-2">
                  Paste CSV data with just driver ID, week, and concessions (DNR) numbers
                </p>
                <Textarea
                  id="concessions-data"
                  placeholder={concessionsTemplate}
                  value={concessionsData}
                  onChange={(e) => setConcessionsData(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-sm text-amber-700 font-medium mb-2">Expected format:</p>
                <code className="text-xs text-amber-600 whitespace-pre-line">
                  driver_id,week,concessions
                </code>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700">
                    {file ? file.name : 'Drop your CSV file here'}
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </label>
                </div>
              </div>
              {file && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">{file.name}</span>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-800">Import Successful</h3>
              </div>
              <div className="text-sm text-green-700">
                <p>Processed: {results.processed} records</p>
                <p>Imported: {results.imported} records</p>
                {results.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside">
                      {results.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isUploading ||
                (activeTab === 'extended' && !extendedData.trim()) ||
                (activeTab === 'concessions' && !concessionsData.trim()) ||
                (activeTab === 'file' && !file)
              }
              className="min-w-[100px]"
            >
              {isUploading ? 'Importing...' : 'Import Data'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
