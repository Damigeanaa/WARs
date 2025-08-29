/**
 * Utility functions for exporting data to various formats
 */

export interface ExportColumn {
  key: string
  header: string
  format?: (value: any) => string
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[]
): string {
  if (data.length === 0) return ''

  // Create header row
  const headers = columns.map(col => `"${col.header}"`).join(',')
  
  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key]
      
      // Apply formatting if provided
      if (col.format && value !== null && value !== undefined) {
        value = col.format(value)
      }
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        value = ''
      }
      
      // Convert to string and escape quotes
      const stringValue = String(value).replace(/"/g, '""')
      
      return `"${stringValue}"`
    }).join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(
  csvContent: string,
  filename: string
): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  const csvContent = arrayToCSV(data, columns)
  downloadCSV(csvContent, filename)
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date): string {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString()
}

/**
 * Format simple date for export
 */
export function formatSimpleDateForExport(date: string | Date): string {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString()
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string = 'csv'): string {
  const now = new Date()
  const timestamp = now.toISOString().split('T')[0] + '_' + 
                   now.toTimeString().split(' ')[0].replace(/:/g, '-')
  return `${prefix}_${timestamp}.${extension}`
}

/**
 * Driver export columns configuration
 */
export const DRIVER_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'driver_id', header: 'Driver ID' },
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'license_number', header: 'License Number' },
  { key: 'status', header: 'Status' },
  { key: 'employment_type', header: 'Employment Type' },
  { 
    key: 'annual_vacation_days', 
    header: 'Annual Vacation Days',
    format: (value) => value || '25'
  },
  { 
    key: 'used_vacation_days', 
    header: 'Used Vacation Days',
    format: (value) => value || '0'
  },
  { 
    key: 'join_date', 
    header: 'Join Date',
    format: formatSimpleDateForExport
  },
  { key: 'current_address', header: 'Address' },
  { 
    key: 'created_at', 
    header: 'Created At',
    format: formatDateForExport
  }
]

/**
 * Warning export columns configuration
 */
export const WARNING_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'driver_name', header: 'Driver Name' },
  { key: 'driver_email', header: 'Driver Email' },
  { key: 'type', header: 'Warning Type' },
  { key: 'description', header: 'Description' },
  { key: 'severity', header: 'Severity' },
  { key: 'status', header: 'Status' },
  { key: 'location', header: 'Location' },
  { 
    key: 'date', 
    header: 'Warning Date',
    format: formatSimpleDateForExport
  },
  { 
    key: 'expiration_date', 
    header: 'Expiration Date',
    format: formatSimpleDateForExport
  },
  { 
    key: 'created_at', 
    header: 'Created At',
    format: formatDateForExport
  }
]
