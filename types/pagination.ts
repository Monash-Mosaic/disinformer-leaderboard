import { Player } from "@/types/leaderboard";

export interface PaginationCursor {
    pageNumber: number;
    lastDocId: string; // Document ID of last item on page
    lastDocPoint: number; // Point value of last item
    createdAt: number; // Timestamp for cache expiry (1 hour TTL)
}

export interface LeaderboardPageResult {
    players: Player[];
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    cursors: {
        nextPageDocId?: string; // For prefetching
        prevPageDocId?: string;
    };
}

export interface SearchPaginationResult extends LeaderboardPageResult {
    searchTerm: string;
    totalSearchResults: number;
    searchPages: number;
}