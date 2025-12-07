import { RankingCriteria } from "@/types/leaderboard";

export const CURSOR_CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
    cursors: Map<number, string>;
    timestamp: number;
}

export class CursorCache {
    // In-memory cache structure:
    // {
    //   "mode:searchTerm": {
    //       cursors: Map<pageNumber, docId>,
    //       timestamp: number
    //   }
    // }
    private cache = new Map<string, CacheEntry>();

    getKey(mode: RankingCriteria, searchTerm: string = ""): string {
        return `${mode}:${searchTerm}`;
    }

    /**
     * Check if cache entry exists and is not expired
     */
    private isEntryValid(entry: CacheEntry | undefined): boolean {
        if (!entry) return false;
        return Date.now() - entry.timestamp <= CURSOR_CACHE_TTL;
    }

    /**
     * Get cursor for a specific page
     */
    getCursor(mode: RankingCriteria, pageNumber: number, searchTerm = ""): string | null {
        const key = this.getKey(mode, searchTerm);
        const entry = this.cache.get(key);

        if (!this.isEntryValid(entry)) {
            return null;
        }

        return entry!.cursors.get(pageNumber) ?? null;
    }

    /**
     * Set cursor for a page
     */
    setCursor(mode: RankingCriteria, pageNumber: number, docId: string, searchTerm = ""): void {
        const key = this.getKey(mode, searchTerm);
        let entry = this.cache.get(key);

        if (!entry) {
            entry = { cursors: new Map(), timestamp: Date.now() };
            this.cache.set(key, entry);
        }

        entry.cursors.set(pageNumber, docId);
    }

    /**
     * Get cache statistics for monitoring and debugging
     */
    getStats(mode: RankingCriteria, searchTerm = ""): {
        totalCursors: number;
        cacheAge: number;
        isExpired: boolean;
    } {
        const key = this.getKey(mode, searchTerm);
        const entry = this.cache.get(key);

        if (!entry) {
            return {
                totalCursors: 0,
                cacheAge: 0,
                isExpired: true,
            };
        }

        const cacheAge = Date.now() - entry.timestamp;
        const isExpired = cacheAge > CURSOR_CACHE_TTL;

        return {
            totalCursors: entry.cursors.size,
            cacheAge,
            isExpired,
        };
    }

    /**
     * Invalidate cache for a specific mode/search combination
     */
    invalidate(mode: RankingCriteria, searchTerm = ""): void {
        const key = this.getKey(mode, searchTerm);
        this.cache.delete(key);
    }
}
