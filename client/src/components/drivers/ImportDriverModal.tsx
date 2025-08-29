import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

interface ImportDriverModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ImportResult {
  success: boolean
  message: string
  imported?: number
  errors?: string[]
}

export default function ImportDriverModal({ isOpen, onClose }: ImportDriverModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        alert('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile)
      setResult(null)
    } else {
      alert('Please drop a CSV file')
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('csv', file)

      const response = await fetch('http://localhost:3001/api/import/drivers', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          imported: data.imported,
        })
        // Refresh the drivers list
        queryClient.invalidateQueries({ queryKey: ['drivers'] })
      } else {
        setResult({
          success: false,
          message: data.error || 'Import failed',
          errors: data.errors || [],
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error occurred during import',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setIsUploading(false)
    onClose()
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Drivers</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import drivers. The CSV should contain delivery associate data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          {!file ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your CSV file here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Accepts CSV files with delivery associate data
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select CSV file for import"
          />

          {/* CSV Format Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  Expected CSV format: Week, Delivery Associate Name, Delivery Associate ID, etc.
                  The system will use the "Delivery Associate ID" as the driver ID.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import Result */}
          {result && (
            <Card className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="pt-4">
                <div className="flex items-start space-x-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className={result.success ? 'text-green-800' : 'text-red-800'}>
                    <div className="text-sm">{result.message}</div>
                    {result.imported && (
                      <div className="mt-1 font-medium text-sm">
                        Successfully imported {result.imported} drivers
                      </div>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-sm">Errors:</p>
                        <ul className="list-disc list-inside text-sm">
                          {result.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li>... and {result.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || isUploading}
              className="min-w-[100px]"
            >
              {isUploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </div>
              ) : (
                'Import'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
