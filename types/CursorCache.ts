import { RankingCriteria } from "@/types/leaderboard";
export const CURSOR_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export class CursorCache {
    // In-memory cache structure:
    // {
    //   "mode:searchTerm": {
    //       cursors: Map<pageNumber, docId>,
    //       timestamp: number
    //   }
    // }
    private cache = new Map<string, { cursors: Map<number, string>; timestamp: number; }>();

    getKey(mode: RankingCriteria, searchTerm: string = "") {
        return `${mode}:${searchTerm}`;
    }

    getCursor(mode: RankingCriteria, pageNumber: number, searchTerm = "") {
        const key = this.getKey(mode, searchTerm);
        const entry = this.cache.get(key);

        if (!entry || Date.now() - entry.timestamp > CURSOR_CACHE_TTL) {
            return null;
        }

        return entry.cursors.get(pageNumber);
    }

    setCursor(mode: RankingCriteria, pageNumber: number, docId: string, searchTerm = "") {
        const key = this.getKey(mode, searchTerm);
        let entry = this.cache.get(key);

        if (!entry) {
            entry = { cursors: new Map(), timestamp: Date.now() };
            this.cache.set(key, entry);
        }

        entry.cursors.set(pageNumber, docId);
    }

    invalidate(mode: RankingCriteria, searchTerm = "") {
        const key = this.getKey(mode, searchTerm);
        this.cache.delete(key);
    }
}
