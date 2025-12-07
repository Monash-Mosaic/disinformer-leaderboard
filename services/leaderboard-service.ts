import { Player, RankingCriteria } from "@/types/leaderboard";
import {
    query,
    orderBy,
    limit,
    startAfter,
    where,
    getCountFromServer,
    getDoc,
    getDocs,
    doc,
    Query,
    DocumentData,
} from "firebase/firestore";
import { playersCollection } from "@/utils/firebase.client";
import { LeaderboardPageResult } from "@/types/pagination";
import { CursorCache } from "../types/CursorCache";

const ITEMS_PER_PAGE = 10;
const cursorCache = new CursorCache();


/**
 * IMPLEMENTATION: Prefetch All Cursors
 *
 * Architecture:
 * - All cursors are prefetched upfront on first access
 * - Ensures O(1) cursor lookup for any page
 * - Simple and reliable - no complex bridging logic needed
 *
 * Performance characteristics:
 * - First access (cold start): Prefetch all cursors once
 * - All subsequent accesses: O(1) cursor lookup + O(ITEMS_PER_PAGE) document fetch
 * - Sequential navigation (1 -> 2 -> 3): O(1) per page
 * - Random access (1 -> 50 -> 10): O(1) per page after prefetch
 * - Search switching: Separate prefetch per search term
 * - Mode switching: Separate prefetch per mode
 *
 * Supports: Random access, search filtering, mode switching
 * Scales to: Works reliably for any dataset size
 */

// Helper: Build base query without pagination (for counting and base operations)
function buildBaseQueryWithoutPagination(
    mode: RankingCriteria,
    searchTerm?: string
): Query {
    let q: Query = playersCollection;

    const rankingField = mode === RankingCriteria.Netizen
        ? "totalNetizenPoints"
        : "totalDisinformerPoints";

    const searchTermNormalized = searchTerm ? searchTermNormalize(searchTerm) : undefined;

    // Add search filter if provided
    if (searchTermNormalized) {
        q = query(
            q,
            where('username_lowercase', '>=', searchTermNormalized),
            where('username_lowercase', '<=', searchTermNormalized + '\uf8ff')
        );
    }

    // Apply ordering (no limit here)
    q = query(
        q,
        orderBy(rankingField, 'desc'),
        orderBy('totalGamesPlayed', 'asc'),
        orderBy('username_lowercase', 'asc')
    );

    return q;
}

// Helper: Add pagination to a base query
function addPaginationLimitToQuery(baseQuery: Query, pageSize: number = ITEMS_PER_PAGE + 1): Query {
    return query(baseQuery, limit(pageSize));
}

// Helper: Normalize search term
function searchTermNormalize(term: string): string {
    return term.trim().toLowerCase();
}

// Helper: Get total document count (without limit)
async function getTotalCount(mode: RankingCriteria, searchTerm?: string): Promise<number> {
    const baseQuery = buildBaseQueryWithoutPagination(mode, searchTerm);
    const snapshot = await getCountFromServer(baseQuery);
    return snapshot.data().count;
}

/**
 * HELPER FUNCTION 1: Prefetch all cursors upfront on first access
 * 
 * This function fetches all documents and caches cursors for every page.
 * This ensures O(1) access for any page without complex bridging logic.
 * 
 * Approach: Simple and reliable
 * - Fetch all documents once
 * - Cache cursor at end of each page
 */
async function prefetchAllCursors(
    baseQuery: Query,
    totalPlayers: number,
    mode: RankingCriteria,
    searchTermNormalized?: string
): Promise<void> {
    try {
        // Only prefetch if not already done
        const stats = cursorCache.getStats(mode, searchTermNormalized);
        if (stats.totalCursors > 0) {
            console.debug(`[Cursor] Prefetch already done. Skipping.`);
            return;
        }

        console.debug(`[Cursor] Prefetching all cursors for ${totalPlayers} players...`);

        // Fetch all documents in one go
        const allQuery = addPaginationLimitToQuery(baseQuery, totalPlayers);
        const snapshot = await getDocs(allQuery);
        const allDocs = snapshot.docs;

        // Cache cursor at end of each page
        for (let i = 0; i < allDocs.length; i++) {
            const pageNumber = Math.floor(i / ITEMS_PER_PAGE) + 1;

            // Cache cursor at end of each page
            if ((i + 1) % ITEMS_PER_PAGE === 0 || i === allDocs.length - 1) {
                cursorCache.setCursor(mode, pageNumber, allDocs[i].id, searchTermNormalized);
            }
        }

        const finalStats = cursorCache.getStats(mode, searchTermNormalized);
        console.debug(
            `[Cursor] Prefetch complete: ${finalStats.totalCursors} cursors`
        );
    } catch (error) {
        console.error(`[Cursor] Error prefetching cursors:`, error);
    }
}

// Main: Fetch page with cursor-based random access
export async function getPaginatedLeaderboard(
    pageNumber: number = 1,
    mode: RankingCriteria = RankingCriteria.Disinformer,
    searchTerm?: string
): Promise<LeaderboardPageResult> {
    try {
        const searchTermNormalized = searchTerm ? searchTermNormalize(searchTerm) : undefined;

        // Step 1: Get total count (without limit)
        const totalPlayers = await getTotalCount(mode, searchTermNormalized);
        const totalPages = Math.ceil(totalPlayers / ITEMS_PER_PAGE);

        // Step 2: Validate page number
        if (pageNumber < 1 || pageNumber > totalPages) {
            pageNumber = 1;
        }

        // Step 3: Build base query for this page
        const baseQuery = buildBaseQueryWithoutPagination(mode, searchTermNormalized);

        // Step 4: Prefetch all cursors on first access
        await prefetchAllCursors(baseQuery, totalPlayers, mode, searchTermNormalized);

        // Step 5: Get cursor for this page (O(1) lookup)
        let pageQuery = addPaginationLimitToQuery(baseQuery, ITEMS_PER_PAGE + 1);

        if (pageNumber > 1) {
            const cursorDocId = cursorCache.getCursor(mode, pageNumber - 1, searchTermNormalized);

            if (cursorDocId) {
                // Use cached cursor to jump to page
                const cursorDocRef = doc(playersCollection, cursorDocId);
                const cursorSnapshot = await getDoc(cursorDocRef);
                pageQuery = query(baseQuery, startAfter(cursorSnapshot), limit(ITEMS_PER_PAGE + 1));
            }
        }

        // Step 6: Execute the page query
        const querySnapshot = await getDocs(pageQuery);
        const allDocs = querySnapshot.docs;

        // Step 7: Transform documents to Player objects
        const players: Player[] = allDocs.slice(0, ITEMS_PER_PAGE).map((doc: DocumentData) => {
            const data = doc.data();
            return {
                ...data,
                totalDisinformerPoints: data.totalDisinformerPoints ?? 0,
                totalNetizenPoints: data.totalNetizenPoints ?? 0,
                id: doc.id,
            } as Player;
        });

        // Step 8: Log cache stats for debugging
        const stats = cursorCache.getStats(mode, searchTermNormalized);
        console.debug(
            `[Leaderboard] Page ${pageNumber} fetched. Cache: ${stats.totalCursors} cursors`
        );

        return {
            players,
            totalPages,
            currentPage: pageNumber,
            hasNextPage: pageNumber < totalPages,
            hasPrevPage: pageNumber > 1,
            cursors: {
                nextPageDocId: allDocs.length > ITEMS_PER_PAGE
                    ? allDocs[ITEMS_PER_PAGE].id
                    : undefined,
                prevPageDocId: pageNumber > 1
                    ? players[0]?.id
                    : undefined,
            },
        };
    } catch (error) {
        console.error("Error fetching leaderboard page:", error);
        throw error;
    }
}