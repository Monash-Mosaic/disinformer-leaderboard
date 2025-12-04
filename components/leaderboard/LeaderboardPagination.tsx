"use client";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
    onPageClick: (page: number) => void;
}

/**
 * Generates an array of page numbers to display in pagination
 * 
 * Algorithm:
 * - Always show first and last page
 * - Show current page and 1-2 pages on either side
 * - Use "..." for gaps when there are too many pages
 * 
 * Examples:
 * - Pages 1-7: [1, 2, 3, 4, 5, 6, 7]
 * - Current page 5 of 20: [1, "...", 4, 5, 6, "...", 20]
 * - Current page 2 of 20: [1, 2, 3, "...", 20]
 * - Current page 19 of 20: [1, "...", 18, 19, 20]
 * 
 * @param currentPage - The current active page
 * @param totalPages - Total number of pages
 * @returns Array of page numbers and ellipsis markers
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
    const pages: (number | string)[] = [];
    const delta = 1; // Number of pages to show on each side of current page
    
    // If total pages is small enough, show all pages
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }
    
    // Always add first page
    pages.push(1);
    
    // Calculate range around current page
    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);
    
    // Add left ellipsis if needed
    if (rangeStart > 2) {
        pages.push("...");
    }
    
    // Add pages around current page
    for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
    }
    
    // Add right ellipsis if needed
    if (rangeEnd < totalPages - 1) {
        pages.push("...");
    }
    
    // Always add last page
    if (totalPages > 1) {
        pages.push(totalPages);
    }
    
    return pages;
}

export default function Pagination({ currentPage, totalPages, onPrev, onNext, onPageClick }: PaginationProps) {
    const pageNumbers = getPageNumbers(currentPage, totalPages);
    
    return (
        <div className="mt-8 flex justify-center items-center gap-2">
            {/* Previous button */}
            <button
                onClick={onPrev}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
            >
                &lt;
            </button>
            
            {/* Page numbers with ellipsis */}
            {pageNumbers.map((page, index) => {
                if (page === "...") {
                    return (
                        <span
                            key={`ellipsis-${index}`}
                            className="px-3 py-2 text-zinc-500 dark:text-zinc-400"
                        >
                            ...
                        </span>
                    );
                }
                
                const pageNum = page as number;
                const isActive = pageNum === currentPage;
                
                return (
                    <button
                        key={pageNum}
                        onClick={() => onPageClick(pageNum)}
                        className={`px-3 py-2 rounded min-w-10 transition-colors ${
                            isActive
                                ? "bg-blue-500 text-white font-bold"
                                : "hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={isActive ? "page" : undefined}
                    >
                        {pageNum}
                    </button>
                );
            })}
            
            {/* Next button */}
            <button
                onClick={onNext}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
            >
                &gt;
            </button>
        </div>
    );
}