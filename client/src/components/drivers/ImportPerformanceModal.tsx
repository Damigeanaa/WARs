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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Database, CheckCircle, X } from 'lucide-react'

interface ImportPerformanceModalProps {
  isOpen: boolean
  onClose: () => void
}

const ImportPerformanceModal: React.FC<ImportPerformanceModalProps> = ({ isOpen, onClose }) => {
  const [extendedData, setExtendedData] = useState('')
  const [week, setWeek] = useState('36')
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const extendedTemplate = `A970NL7W6Y5CS 913 99.67% 1095 0 98.62% 100% 0 72.35%
A9MF7F9M3ZIZR 314 99.68% 0 0 100% 100% 0 90.07%
ACBZ85FMWDKAA 300 99.01% 3333 0 100% - 0 59.72%
AE4CEMB80WD3D 801 98.77% 2497 0 93.36% 72.73% 0 77.26%
AE051D11QT12D 332 100% 3012 0 98.33% - 0 -`

  const handleExtendedImport = async () => {
    if (!extendedData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste performance data first",
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
          csvData: extendedData,
          week: week,
          type: 'extended'
        }),
      })

      const result = await response.json()
      setResults(result)

      if (result.success) {
        toast({
          title: "Import Successful",
          description: result.message,
          variant: "default"
        })
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error importing performance data:', error)
      toast({
        title: "Import Failed", 
        description: "Network error occurred",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setExtendedData('')
    setWeek('36')
    setResults(null)
    onClose()
  }

  const formatErrors = (errors: string[]) => {
    if (!errors || errors.length === 0) return null
    
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
        <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
          {errors.slice(0, 10).map((error, index) => (
            <li key={index}>{error}</li>
          ))}
          {errors.length > 10 && (
            <li className="text-red-600">... and {errors.length - 10} more errors</li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Import Performance Data
          </DialogTitle>
          <DialogDescription>
            Paste extended performance metrics including DCR, LoR DPMO, POD, CC, CE, CDF percentages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Week Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="week" className="text-right font-medium">
              Week
            </Label>
            <Input
              id="week"
              type="number"
              min="1"
              max="53"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="col-span-3"
              placeholder="Enter week number (1-53)"
            />
          </div>

          {/* Extended Performance Section */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <Label htmlFor="extended-data" className="text-base font-medium">
                Extended Performance Data (Space-Separated Format)
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Paste space-separated data with Transporter ID, Delivered, DCR, DNR DPMO, LoR DPMO, POD, CC, CE, CDF percentages
              </p>
              
              <Textarea
                id="extended-data"
                placeholder={extendedTemplate}
                value={extendedData}
                onChange={(e) => setExtendedData(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 font-medium mb-1">Expected format:</p>
                <code className="text-xs text-blue-700 break-all">
                  Transporter_ID Delivered DCR DNR_DPMO LoR_DPMO POD CC CE CDF
                </code>
              </div>
            </div>

            <Button 
              onClick={handleExtendedImport}
              disabled={isUploading || !extendedData.trim()}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Importing Performance Data...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Import Extended Performance Data
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          {results && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                {results.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <X className="w-5 h-5 text-red-500" />
                )}
                <h3 className="font-medium">
                  {results.success ? 'Import Successful' : 'Import Failed'}
                </h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <p><strong>Processed:</strong> {results.processed} records</p>
                {results.imported !== undefined && (
                  <p><strong>Imported:</strong> {results.imported} records</p>
                )}
                {results.updated !== undefined && (
                  <p><strong>Updated:</strong> {results.updated} records</p>
                )}
                {results.message && (
                  <p className="text-green-600"><strong>Message:</strong> {results.message}</p>
                )}
              </div>

              {results.errors && formatErrors(results.errors)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImportPerformanceModal