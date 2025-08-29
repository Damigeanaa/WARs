import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV, generateFilename, ExportColumn } from '@/utils/export'

interface ExportButtonProps {
  data: any[]
  columns: ExportColumn[]
  filename: string
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children?: React.ReactNode
}

export default function ExportButton({
  data,
  columns,
  filename,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className,
  children
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (data.length === 0) {
      toast.error('No data to export')
      return
    }

    setIsExporting(true)
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const csvFilename = generateFilename(filename, 'csv')
      exportToCSV(data, columns, csvFilename)
      
      toast.success(`✅ Exported ${data.length} records to ${csvFilename}`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('❌ Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isExporting}
      className={className}
      onClick={handleExport}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {children || (isExporting ? 'Exporting...' : 'Export CSV')}
    </Button>
  )
}
