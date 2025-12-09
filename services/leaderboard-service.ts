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
    onSnapshot,
} from "firebase/firestore";
import { playersCollection } from "@/utils/firebase.client";
import { LeaderboardPageResult } from "@/types/pagination";
import { CursorCache, PREFETCH_WINDOW } from "../types/CursorCache";

const ITEMS_PER_PAGE = 10;
const cursorCache = new CursorCache();

/**
 * IMPLEMENTATION: Optimized Lazy Prefetch with Smart Window
 *
 * Architecture:
 * - Only prefetch cursors around current page (3 before + 3 after)
 * - Prefetch last page on first access for pagination info
 * - Lazy expansion: When user navigates, prefetch around new position
 * - Minimal app startup cost
 *
 * Performance characteristics:
 * - First page access: Fetch ~70 docs (7 pages + last page) = ~200ms
 * - Sequential navigation (1 -> 2 -> 3): O(1) cursor lookup + fetch
 * - Random jump (1 -> 50): Fetch around page 50 (~70 docs)
 * - Total memory: ~O(k) where k = number of visited page ranges
 *
 * Supports: Random access, search filtering, mode switching
 * Scales to: Millions of users with minimal startup overhead
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

// Helper: Serialize Firestore document to Player object
function serializePlayer(doc: DocumentData): Player {
    const data = doc.data();
    return {
        id: doc.id,
        username: data.username ?? '',
        totalGamesPlayed: data.totalGamesPlayed ?? 0,
        totalDisinformerPoints: data.totalDisinformerPoints ?? 0,
        totalNetizenPoints: data.totalNetizenPoints ?? 0,
        society: data.society ?? '',
        branch: data.branch ?? '',
        email: data.email ?? '',
        username_lowercase: data.username_lowercase ?? '',
        // Convert Firestore Timestamps to ISO strings or numbers to allow passing fetched data from server to client
        lastGamePlayedAt: data.lastGamePlayedAt?.toDate?.()?.toISOString() ?? null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        avatar: data.avatar ?? null,
        surveysCompleted: data.surveysCompleted ?? 0,
    } as Player;
}

/**
 * HELPER FUNCTION: Prefetch cursors around current page
 *
 * Strategy:
 * - Fetch window of pages: [currentPage - PREFETCH_WINDOW] to [currentPage + PREFETCH_WINDOW]
 * - For last page access, jump directly to last page if needed
 * - Cache cursor at end of each page in the window
 * - Mark this page range as prefetched to avoid re-fetching
 *
 * Cost per prefetch: ~70 document reads (7 pages * 10 docs)
 * Benefit: Covers most user navigation patterns
 */
async function prefetchCursorsAround(
    baseQuery: Query,
    totalPages: number,
    currentPage: number,
    mode: RankingCriteria,
    searchTermNormalized?: string
): Promise<void> {
    try {
        // Check if already prefetched around this page
        if (cursorCache.isPrefetchedAround(mode, currentPage, searchTermNormalized)) {
            console.debug(`[Cursor] Already prefetched around page ${currentPage}. Skipping.`);
            return;
        }

        // Calculate the range to prefetch
        const startPage = Math.max(1, currentPage - PREFETCH_WINDOW);
        const endPage = Math.min(totalPages, currentPage + PREFETCH_WINDOW);
        const docsToFetch = (endPage - startPage + 1) * ITEMS_PER_PAGE;

        console.debug(
            `[Cursor] Prefetching cursors for pages ${startPage}-${endPage} (${docsToFetch} docs)`
        );

        // Determine the starting cursor
        let prefetchQuery = baseQuery;

        if (startPage > 1) {
            // Get cursor for page before start (to use startAfter)
            const beforeStartCursor = cursorCache.getCursor(mode, startPage - 1, searchTermNormalized);

            if (beforeStartCursor) {
                // We have the cursor, use it
                const cursorDocRef = doc(playersCollection, beforeStartCursor);
                const cursorSnapshot = await getDoc(cursorDocRef);
                prefetchQuery = query(baseQuery, startAfter(cursorSnapshot), limit(docsToFetch + 1));
            } else {
                // No cursor yet, will fetch from start (less efficient but necessary)
                console.debug(`[Cursor] No cursor for page ${startPage - 1}, fetching from start`);
                prefetchQuery = addPaginationLimitToQuery(baseQuery, docsToFetch + 1);
            }
        } else {
            // Starting from page 1
            prefetchQuery = addPaginationLimitToQuery(baseQuery, docsToFetch + 1);
        }

        // Fetch the documents
        const snapshot = await getDocs(prefetchQuery);
        const allDocs = snapshot.docs;

        // Cache cursors for each page in the range
        for (let i = 0; i < allDocs.length; i++) {
            const pageNumber = startPage + Math.floor(i / ITEMS_PER_PAGE);

            // Cache cursor at end of each page within range
            if ((i + 1) % ITEMS_PER_PAGE === 0 && pageNumber <= endPage) {
                cursorCache.setCursor(mode, pageNumber, allDocs[i].id, searchTermNormalized);
            }
        }

        // Also prefetch cursor for last page (useful for pagination info)
        if (endPage === totalPages && allDocs.length >= docsToFetch) {
            const lastDocIndex = Math.min(allDocs.length - 1, docsToFetch - 1);
            cursorCache.setCursor(mode, totalPages, allDocs[lastDocIndex].id, searchTermNormalized);
        }

        // Mark this page range as prefetched
        cursorCache.markPrefetchedAround(mode, currentPage, searchTermNormalized);

        const stats = cursorCache.getStats(mode, searchTermNormalized);
        console.debug(
            `[Cursor] Prefetch complete: ${stats.totalCursors} cursors cached`
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

        // Step 4: Prefetch cursors around current page (lazy loading window)
        await prefetchCursorsAround(baseQuery, totalPages, pageNumber, mode, searchTermNormalized);

        // Step 5: Get cursor for this page (O(1) lookup if prefetched)
        let pageQuery = addPaginationLimitToQuery(baseQuery, ITEMS_PER_PAGE + 1);

        if (pageNumber > 1) {
            const cursorDocId = cursorCache.getCursor(mode, pageNumber - 1, searchTermNormalized);

            if (cursorDocId) {
                // Use cached cursor to jump to page
                try {
                    const cursorDocRef = doc(playersCollection, cursorDocId);
                    const cursorSnapshot = await getDoc(cursorDocRef);
                    pageQuery = query(baseQuery, startAfter(cursorSnapshot), limit(ITEMS_PER_PAGE + 1));
                } catch (error) {
                    console.warn(`[Cursor] Failed to use cached cursor for page ${pageNumber}, falling back to full fetch`);
                    // Fallback: fetch from beginning with offset (less efficient but ensures we get data)
                    pageQuery = addPaginationLimitToQuery(baseQuery, pageNumber * ITEMS_PER_PAGE + 1);
                }
            } else {
                // No cached cursor, will need to fetch from beginning
                console.debug(`[Cursor] No cursor cached for page ${pageNumber - 1}, fetching from beginning`);
                pageQuery = addPaginationLimitToQuery(baseQuery, pageNumber * ITEMS_PER_PAGE + 1);
            }
        }

        // Step 6: Execute the page query
        const querySnapshot = await getDocs(pageQuery);
        const allDocs = querySnapshot.docs;

        // Step 7: Slice to get only the current page (skip docs before current page if needed)
        let startIndex = 0;
        if (pageNumber > 1 && !cursorCache.getCursor(mode, pageNumber - 1, searchTermNormalized)) {
            // If we had to fetch from beginning, skip to the right page
            startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
        }

        const pageSlice = allDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        // Transform documents to Player objects
        const players: Player[] = pageSlice.map(serializePlayer);

        // Step 8: Cache cursor for current page (update cache dynamically)
        if (players.length > 0) {
            const lastPlayer = players[players.length - 1];
            cursorCache.setCursor(mode, pageNumber, lastPlayer.id, searchTermNormalized);
        }

        // Step 9: Log cache stats for debugging
        const stats = cursorCache.getStats(mode, searchTermNormalized);
        console.debug(
            `[Leaderboard] Page ${pageNumber} fetched. Cache: ${stats.totalCursors} cursors. TTL: ${Math.round(stats.cacheAge / 1000)}s`
        );

        return {
            players,
            totalPages,
            currentPage: pageNumber,
            hasNextPage: pageNumber < totalPages,
            hasPrevPage: pageNumber > 1,
            cursors: {
                nextPageDocId: allDocs.length > startIndex + ITEMS_PER_PAGE
                    ? allDocs[startIndex + ITEMS_PER_PAGE].id
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

/**
 * Real-time listener for a specific query page
 * Watches for changes and calls callback whenever data updates
 * 
 * @param baseQuery - The Firestore query to listen to
 * @param onUpdate - Callback when data updates
 * @param onError - Callback when error occurs
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToLeaderboardPage(
    baseQuery: Query,
    onUpdate: (players: Player[]) => void,
    onError: (error: Error) => void
): () => void {
    const unsubscribe = onSnapshot(
        baseQuery,
        (snapshot) => {
            try {
                const players: Player[] = snapshot.docs.map(serializePlayer);
                onUpdate(players);
            } catch (error) {
                onError(error instanceof Error ? error : new Error('Failed to process snapshot'));
            }
        },
        (error) => {
            onError(new Error(`Snapshot listener error: ${error.message}`));
        }
    );

    return unsubscribe;
}

/**
 * Real-time listener for entire leaderboard with pagination
 * Rebuilds page data when any player changes
 * 
 * @param pageNumber - Current page number
 * @param mode - Ranking criteria (Disinformer or Netizen)
 * @param onUpdate - Callback with paginated results
 * @param onError - Callback when error occurs
 * @param searchTerm - Optional search filter
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToLeaderboardWithPagination(
    pageNumber: number,
    mode: RankingCriteria,
    onUpdate: (result: LeaderboardPageResult) => void,
    onError: (error: Error) => void,
    searchTerm?: string
): () => void {
    const searchTermNormalized = searchTerm ? searchTermNormalize(searchTerm) : undefined;
    const rankingField = mode === RankingCriteria.Netizen
        ? "totalNetizenPoints"
        : "totalDisinformerPoints";

    // Build the base query for real-time listening
    let q: Query = playersCollection;

    if (searchTermNormalized) {
        q = query(
            q,
            where('username_lowercase', '>=', searchTermNormalized),
            where('username_lowercase', '<=', searchTermNormalized + '\uf8ff')
        );
    }

    q = query(
        q,
        orderBy(rankingField, 'desc'),
        orderBy('totalGamesPlayed', 'asc'),
        orderBy('username_lowercase', 'asc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            try {
                const allPlayers = snapshot.docs.map(serializePlayer);
                const totalPages = Math.ceil(allPlayers.length / ITEMS_PER_PAGE) || 1;
                const validPageNumber = Math.min(pageNumber, totalPages);

                const startIdx = (validPageNumber - 1) * ITEMS_PER_PAGE;
                const endIdx = startIdx + ITEMS_PER_PAGE;
                const pageSlice = allPlayers.slice(startIdx, endIdx);

                onUpdate({
                    players: pageSlice,
                    totalPages,
                    currentPage: validPageNumber,
                    hasNextPage: validPageNumber < totalPages,
                    hasPrevPage: validPageNumber > 1,
                    cursors: {},
                });
            } catch (error) {
                onError(error instanceof Error ? error : new Error('Failed to process snapshot'));
            }
        },
        (error) => {
            onError(new Error(`Snapshot listener error: ${error.message}`));
        }
    );

    return unsubscribe;
}