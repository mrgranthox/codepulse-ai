import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Layers,
  ArrowRight
} from 'lucide-react';

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number | 'All';
  pageSizeOptions?: (number | 'All')[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number | 'All') => void;
  itemLabel?: string;
  isInfiniteScroll?: boolean;
  onToggleInfiniteScroll?: () => void;
  compact?: boolean;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100, 'All'],
  onPageChange,
  onPageSizeChange,
  itemLabel = 'items',
  isInfiniteScroll,
  onToggleInfiniteScroll,
  compact = false,
  className = ''
}) => {
  const [jumpInput, setJumpInput] = useState<string>('');

  if (totalItems === 0) {
    return null;
  }

  const isAll = pageSize === 'All';
  const numericSize = typeof pageSize === 'number' ? pageSize : totalItems;
  const startItem = isAll ? 1 : Math.min((currentPage - 1) * numericSize + 1, totalItems);
  const endItem = isAll ? totalItems : Math.min(currentPage * numericSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpInput('');
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs ${className}`}>
        <div className="text-slate-400 font-mono text-[11px]">
          Showing <span className="text-slate-200 font-semibold">{startItem}–{endItem}</span> of <span className="text-white font-bold">{totalItems}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1 || isAll}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 border border-slate-800 cursor-pointer transition-colors"
            title="Previous Page"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="text-slate-300 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            {isAll ? 'All' : `${currentPage} / ${totalPages}`}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages || isAll}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 border border-slate-800 cursor-pointer transition-colors"
            title="Next Page"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl ${className}`}>
      {/* Left: Summary & Page Size selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Showing <strong className="text-white font-mono">{startItem}–{endItem}</strong> of{' '}
            <strong className="text-indigo-300 font-mono font-bold">{totalItems}</strong> {itemLabel}
          </span>
        </div>

        {/* Page Size selector */}
        <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-slate-800">
          <span className="text-slate-400 text-[11px]">Per page:</span>
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {pageSizeOptions.map((opt) => (
              <button
                key={String(opt)}
                type="button"
                onClick={() => onPageSizeChange(opt)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  pageSize === opt
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Full Navigation controls */}
      {!isAll && totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          {/* First Page */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-slate-950 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            title="First Page"
            aria-label="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-slate-950 text-slate-300 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
            title="Previous Page"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden md:inline">Prev</span>
          </button>

          {/* Page Number Buttons */}
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((num, idx) => {
              if (num === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-500 font-mono text-xs select-none">
                    ...
                  </span>
                );
              }

              const isCurrent = currentPage === num;
              return (
                <button
                  key={`page-${num}`}
                  type="button"
                  onClick={() => onPageChange(num as number)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 border border-indigo-500'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-slate-950 text-slate-300 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
            title="Next Page"
            aria-label="Next page"
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-slate-950 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            title="Last Page"
            aria-label="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

          {/* Jump to Page Form */}
          {totalPages > 3 && (
            <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 pl-2 border-l border-slate-800">
              <span className="text-[11px] text-slate-400">Go to</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                placeholder={String(currentPage)}
                aria-label="Go to page number"
                className="w-12 px-1.5 py-1 bg-slate-950 border border-slate-800 rounded text-center text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                title="Go"
                aria-label="Submit page jump"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
