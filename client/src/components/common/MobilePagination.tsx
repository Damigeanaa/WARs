import { Button } from '@/components/ui/button'
import { useMobile } from '@/hooks/useMobile'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface MobilePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  totalItems: number
  showItemsPerPage?: boolean
  onItemsPerPageChange?: (itemsPerPage: number) => void
}

export default function MobilePagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  showItemsPerPage = true,
  onItemsPerPageChange
}: MobilePaginationProps) {
  const { isMobile } = useMobile()
  const { t } = useTranslation()

  // Mobile items per page options (smaller numbers for mobile)
  const mobileItemsPerPageOptions = [5, 10, 15, 20]
  const desktopItemsPerPageOptions = [10, 25, 50, 100]
  
  const itemsPerPageOptions = isMobile ? mobileItemsPerPageOptions : desktopItemsPerPageOptions

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const goToPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const goToFirst = () => onPageChange(1)
  const goToLast = () => onPageChange(totalPages)

  // Generate page numbers to show
  const getVisiblePages = () => {
    const maxVisible = isMobile ? 3 : 5
    const pages: (number | 'ellipsis')[] = []
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('ellipsis')
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }
      
      // Always show last page
      if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (totalPages <= 1 && !showItemsPerPage) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Items info and items per page selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span>
            {t('pagination.showingItems', { start: startItem, end: endItem, total: totalItems })}
          </span>
        </div>
        
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">{t('pagination.itemsPerPage')}:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              title={t('pagination.itemsPerPage')}
              aria-label={t('pagination.itemsPerPage')}
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Mobile: Simplified previous/next with page info */}
          {isMobile ? (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('pagination.previous')}
              </Button>
              
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-slate-500">{t('pagination.page')}</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md">
                  {currentPage}
                </span>
                <span className="text-slate-500">{t('pagination.of')} {totalPages}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2"
              >
                {t('pagination.next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            /* Desktop: Full pagination with page numbers */
            <div className="flex items-center justify-center gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('pagination.previous')}
              </Button>
              
              <div className="flex items-center gap-1">
                {getVisiblePages().map((page, index) => (
                  <div key={index}>
                    {page === 'ellipsis' ? (
                      <Button variant="ghost" size="sm" disabled>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className={currentPage === page ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                      >
                        {page}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                {t('pagination.next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Quick jump buttons for mobile when there are many pages */}
      {isMobile && totalPages > 5 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToFirst}
            disabled={currentPage === 1}
            className="text-xs"
          >
            First
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToLast}
            disabled={currentPage === totalPages}
            className="text-xs"
          >
            Last
          </Button>
        </div>
      )}
    </div>
  )
}
