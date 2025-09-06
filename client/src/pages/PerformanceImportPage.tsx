import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useToast } from '../hooks/use-toast'
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react'

interface CSVRow {
  Week: string
  'Delivery Associate Name': string
  'Delivery Associate ID': string
  'Delivered Packages': string
  'Packages Delivered Not Received (DNR)': string
  'DNR DPMO': string
  'Dispatched Packages': string
  'Packages Returned to Station (RTS)': string
  'Packages Returned to Station (RTS) %': string
  'Return To Station DPMO': string
}

export default function PerformanceImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setResults(null)
    } else {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a CSV file.',
        variant: 'destructive'
      })
    }
  }

  const parseCSV = (csvText: string): CSVRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const rows: CSVRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = []
      let current = ''
      let insideQuotes = false

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      if (values.length === headers.length) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]?.replace(/"/g, '') || ''
        })
        rows.push(row as CSVRow)
      }
    }

    return rows
  }

  const transformForAPI = (csvRows: CSVRow[]) => {
    return csvRows.map(row => ({
      week: row.Week,
      driver_name: row['Delivery Associate Name'],
      delivery_associate_id: row['Delivery Associate ID'],
      delivered_packages: row['Delivered Packages'],
      packages_dnr: row['Packages Delivered Not Received (DNR)'],
      dnr_dpmo: row['DNR DPMO'],
      dispatched_packages: row['Dispatched Packages'],
      packages_rts: row['Packages Returned to Station (RTS)'],
      rts_percentage: row['Packages Returned to Station (RTS) %'],
      rts_dpmo: row['Return To Station DPMO']
    }))
  }

  const handleImport = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      const csvText = await file.text()
      const csvRows = parseCSV(csvText)
      
      if (csvRows.length === 0) {
        throw new Error('No valid data found in CSV file')
      }

      const transformedData = transformForAPI(csvRows)
      
      const response = await fetch('http://localhost:3001/api/performance-metrics/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: transformedData })
      })

      const result = await response.json()

      if (response.ok) {
        setResults(result)
        toast({
          title: 'Import Successful',
          description: result.message,
          variant: 'default'
        })
      } else {
        throw new Error(result.error || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = `"Week","Delivery Associate Name","Delivery Associate ID","Delivered Packages","Packages Delivered Not Received (DNR)","DNR DPMO","Dispatched Packages","Packages Returned to Station (RTS)","Packages Returned to Station (RTS) %","Return To Station DPMO"
"2025-35","John Smith","A3U9VDGVEVIMIL","560","4","7,142","567","7","1.23%","12,345"
"2025-35","Sarah Johnson","A2WZKX6ZHFML20","985","3","3,045","992","7","0.71%","7,056"`

    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'performance_sample.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Import Performance Metrics</h1>
        <Button variant="outline" onClick={downloadSampleCSV}>
          <Download className="w-4 h-4 mr-2" />
          Download Sample CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-600">
                  Select a CSV file with performance metrics data
                </p>
              </div>
            </div>

            {file && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">{file.name}</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Size: {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            <Button 
              onClick={handleImport} 
              disabled={!file || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Performance Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Required Columns</h4>
                  <p className="text-sm text-gray-600">
                    Week, Delivery Associate Name, Delivery Associate ID, Delivered Packages, 
                    Packages Delivered Not Received (DNR), DNR DPMO, Dispatched Packages, 
                    Packages Returned to Station (RTS), Packages Returned to Station (RTS) %, 
                    Return To Station DPMO
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Driver Matching</h4>
                  <p className="text-sm text-gray-600">
                    Driver names in the CSV will be matched with existing drivers in the system.
                    Unmatched drivers will be reported as errors.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Data Updates</h4>
                  <p className="text-sm text-gray-600">
                    If performance data already exists for a driver and week combination, 
                    it will be updated with the new values.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Sample Format:</h4>
              <code className="text-xs text-gray-800 block whitespace-nowrap overflow-x-auto">
                "Week","Delivery Associate Name",...<br />
                "2025-35","John Smith",...
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{results.imported}</div>
                <div className="text-sm text-green-700">Records Imported</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{results.updated}</div>
                <div className="text-sm text-blue-700">Records Updated</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {results.errors?.length || 0}
                </div>
                <div className="text-sm text-amber-700">Errors</div>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {results.errors.map((error: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm text-gray-600 mt-4">{results.message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
