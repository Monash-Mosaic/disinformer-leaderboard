"use client";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
    onPageClick: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPrev, onNext, onPageClick }: PaginationProps) {
    return (
        <div className="mt-8 flex justify-center items-center gap-2">
            <button
                onClick={onPrev}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                    key={num}
                    onClick={() => onPageClick(num)}
                    className={`px-3 py-2 rounded ${num === currentPage
                        ? "bg-blue-500 text-white font-bold"
                        : "hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                >
                    {num}
                </button>
            ))}
            <button
                onClick={onNext}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                &gt;
            </button>
        </div>
    );
}