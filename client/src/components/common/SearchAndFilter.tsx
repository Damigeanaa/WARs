import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X, RotateCcw } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface SearchAndFilterProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filters?: {
    [key: string]: {
      value: string
      options: FilterOption[]
      onChange: (value: string) => void
      label: string
    }
  }
  onReset?: () => void
  placeholder?: string
  showFilters?: boolean
  onToggleFilters?: (isVisible: boolean) => void
}

export default function SearchAndFilter({
  searchTerm,
  onSearchChange,
  filters = {},
  onReset,
  placeholder = "Search...",
  showFilters = false,
  onToggleFilters
}: SearchAndFilterProps) {
  const [isFiltersVisible, setIsFiltersVisible] = useState(showFilters)

  const handleToggleFilters = () => {
    const newState = !isFiltersVisible
    setIsFiltersVisible(newState)
    onToggleFilters?.(newState)
  }

  const handleReset = () => {
    onSearchChange('')
    Object.values(filters).forEach(filter => {
      filter.onChange('all')
    })
    onReset?.()
  }

  const hasActiveFilters = searchTerm || 
    Object.values(filters).some(filter => filter.value !== 'all')

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </div>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground w-full sm:w-auto justify-center sm:justify-start"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholder}
              className="pl-10 pr-10 h-12 sm:h-10 text-base sm:text-sm" // Larger on mobile
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-10 w-10 sm:h-8 sm:w-8 p-0"
                onClick={() => onSearchChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {Object.keys(filters).length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleToggleFilters}
              className={`h-12 sm:h-10 px-4 sm:px-3 ${isFiltersVisible ? 'bg-muted' : ''} w-full sm:w-auto`} // Full width on mobile
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {Object.values(filters).filter(f => f.value !== 'all').length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {Object.values(filters).filter(f => f.value !== 'all').length}
                </span>
              )}
            </Button>
          )}
        </div>
        
        {/* Filter Options */}
        {isFiltersVisible && Object.keys(filters).length > 0 && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 p-4 bg-muted/50 rounded-lg border">
            {Object.entries(filters).map(([key, filter]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <label className="text-sm font-medium whitespace-nowrap">
                  {filter.label}:
                </label>
                <Select value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger className="w-full sm:w-36 h-12 sm:h-10"> {/* Full width on mobile */}
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
        
        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="font-medium text-blue-800 mb-1">Active filters:</div>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                  Search: "{searchTerm}"
                </span>
              )}
              {Object.entries(filters)
                .filter(([, filter]) => filter.value !== 'all')
                .map(([, filter]) => (
                  <span key={filter.label} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                    {filter.label}: {filter.options.find(o => o.value === filter.value)?.label}
                  </span>
                ))
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
