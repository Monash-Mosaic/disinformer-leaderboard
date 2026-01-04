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
    if (totalPages <= 11) {
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
            {/* Previous arrow */}
            <button
                onClick={onPrev}
                disabled={currentPage === 1}
                className="flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:opacity-70"
                aria-label="Previous page"
            >
                <span 
                    className="font-['Play'] font-bold text-[24px] text-[#2d4143] disabled:text-gray-400"
                    style={{ letterSpacing: '0.24px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                >
                    Prev
                </span>
                <img src="/assets/arrow-prev.png" alt="Previous" className="w-[33px] h-[33px]" />
            </button>
            
            {/* Page numbers */}
            {pageNumbers.map((page, index) => {
                if (page === "...") {
                    return (
                        <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-[#2d4143] font-['Play'] font-bold text-[24px]"
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
                        className={`min-w-[37px] px-2 font-['Play'] font-bold text-[36px] transition-colors ${
                            isActive
                                ? "text-[#ff4805]"
                                : "text-[#2d4143] hover:text-[#317070]"
                        }`}
                        style={{ letterSpacing: '0.36px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                        aria-label={`Page ${pageNum}`}
                        aria-current={isActive ? "page" : undefined}
                    >
                        {pageNum}
                    </button>
                );
            })}
            
            {/* Next arrow and text */}
            <button
                onClick={onNext}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:opacity-70"
                aria-label="Next page"
            >
                <div className="w-[30px] h-[30px] flex items-center justify-center">
                    <img src="/assets/arrow-next.png" alt="Next" className="w-[33px] h-[33px]" />
                </div>
                <span 
                    className="font-['Play'] font-bold text-[24px] text-[#2d4143] disabled:text-gray-400"
                    style={{ letterSpacing: '0.24px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                >
                    Next
                </span>
            </button>
        </div>
    );
}