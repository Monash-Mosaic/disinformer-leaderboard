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
    limitToLast,
    endBefore,
} from "firebase/firestore";
import { playersCollection } from "@/utils/firebase.client";
import { LeaderboardPageResult } from "@/types/pagination";
import { CursorCache, PREFETCH_WINDOW } from "../types/CursorCache";

const ITEMS_PER_PAGE = 10;
const cursorCache = new CursorCache();

let totalFirestoreReads = 0;

enum NavigationDirection {
    Forward = "Forward",
    Backward = "Backward",
    JumpToStart = "JumpToStart",
    JumpToEnd = "JumpToEnd",
}

// Helper to log Firestore read counts for cost estimation
function logFirestoreReads(operation: string, readCount: number) {
    totalFirestoreReads += readCount;
    console.log(`[Firestore Reads] ${operation}: ${readCount} documents read (Total: ${totalFirestoreReads})`);
}

/**
 * Detect navigation direction based on current and last accessed page
 */
function detectNavigationDirection(
    currentPage: number,
    lastAccessedPage: number | null,
    totalPages: number
): NavigationDirection {
    // First access or no history
    if (lastAccessedPage === null) {
        if (currentPage === 1) {
            return NavigationDirection.JumpToStart;
        } else if (currentPage === totalPages) {
            return NavigationDirection.JumpToEnd;
        }
        return NavigationDirection.Forward;
    }

    // Jump to start
    if (currentPage === 1) {
        return NavigationDirection.JumpToStart;
    }

    // Jump to end
    if (currentPage === totalPages) {
        return NavigationDirection.JumpToEnd;
    }

    // Forward navigation
    if (currentPage > lastAccessedPage) {
        return NavigationDirection.Forward;
    }

    // Backward navigation
    if (currentPage < lastAccessedPage) {
        return NavigationDirection.Backward;
    }

    // Same page (shouldn't happen, but default to forward)
    return NavigationDirection.Forward;
}

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
 * HELPER FUNCTION: Prefetch last page cursor
 * 
 * Ensures the last page is always available for quick jump-to-end navigation
 * This is useful for pagination info and UX
 */
async function prefetchLastPageCursor(
    baseQuery: Query,
    totalPages: number,
    mode: RankingCriteria,
    searchTermNormalized?: string
): Promise<void> {
    let reads = 0;  // Local counter for this function
    try {
        // Check if last page cursor already cached
        if (cursorCache.getCursor(mode, totalPages, searchTermNormalized)) {
            console.debug(`[Cursor] Last page cursor already cached. Skipping.`);
            return;
        }

        console.debug(`[Cursor] Prefetching last page (page ${totalPages}) cursor`);

        // Fetch only the last document (efficient, no skip needed)
        const lastPageQuery = query(baseQuery, limitToLast(1));
        const snapshot = await getDocs(lastPageQuery);
        reads += snapshot.docs.length;  // Count the reads

        if (snapshot.docs.length > 0) {
            const lastDoc = snapshot.docs[0];  // The last document in the query
            cursorCache.setCursor(mode, totalPages, lastDoc.id, searchTermNormalized);
            console.debug(`[Cursor] Last page cursor cached for page ${totalPages}`);
        } else {
            console.warn(`[Cursor] No documents found for last page cursor prefetch`);
        }
    } catch (error) {
        console.error(`[Cursor] Error prefetching last page cursor:`, error);
    }
    logFirestoreReads('prefetchLastPageCursor', reads);  // Log total reads for this operation
}

/**
 * HELPER FUNCTION: Prefetch cursors around current page with adaptive direction-aware strategy
 *
 * Strategy:
 * - Detect navigation direction (Forward, Backward, JumpToStart, JumpToEnd)
 * - Adapt fetch range and query based on direction:
 *   - Forward: Fetch forward from (currentPage - PREFETCH_WINDOW) using startAfter()
 *   - Backward: Fetch backward from currentPage using endBefore() + limitToLast()
 *   - JumpToStart: Fetch forward from page 1
 *   - JumpToEnd: Fetch backward from last page using endBefore() + limitToLast()
 * - Always use cursor-based queries to avoid full database fetches
 * - Gracefully fallback to forward fetch if cursors are missing
 *
 * Optimization: Consistent ~40 document reads per prefetch (4 pages × 10 items)
 * Benefit: Efficient backward navigation without full dataset fetch
 */
async function prefetchCursorsAround(
    baseQuery: Query,
    totalPages: number,
    currentPage: number,
    mode: RankingCriteria,
    searchTermNormalized?: string
): Promise<void> {
    let reads = 0;  // Local counter for this function
    try {
        // Check if already prefetched around this page
        if (cursorCache.isPrefetchedAround(mode, currentPage, searchTermNormalized)) {
            console.debug(`[Cursor] Already prefetched around page ${currentPage}. Skipping.`);
            return;
        }

        // Detect navigation direction
        const lastAccessedPage = cursorCache.getLastAccessedPage(mode, searchTermNormalized);
        const direction = detectNavigationDirection(currentPage, lastAccessedPage, totalPages);

        console.debug(`[Cursor] Navigation: ${direction} (current: ${currentPage}, last: ${lastAccessedPage ?? 'none'})`);

        // Calculate page range based on direction
        let startPage: number;
        let endPage: number;
        let useBackwardFetch = false;

        switch (direction) {
            case NavigationDirection.Backward:
                // For backward navigation, only fetch pages before current page
                endPage = currentPage;
                startPage = Math.max(1, currentPage - PREFETCH_WINDOW);
                useBackwardFetch = true;
                break;

            case NavigationDirection.JumpToEnd:
                // Jump to end: fetch pages before last page
                endPage = currentPage; // currentPage === totalPages
                startPage = Math.max(1, currentPage - PREFETCH_WINDOW);
                useBackwardFetch = true;
                break;

            case NavigationDirection.JumpToStart:
                // Jump to start: fetch pages from beginning
                startPage = 1;
                endPage = Math.min(totalPages, 1 + PREFETCH_WINDOW);
                useBackwardFetch = false;
                break;

            case NavigationDirection.Forward:
            default:
                // Forward navigation: fetch pages around current page
                startPage = Math.max(1, currentPage - PREFETCH_WINDOW);
                endPage = Math.min(totalPages, currentPage + PREFETCH_WINDOW);
                useBackwardFetch = false;
                break;
        }

        // Identify gaps in cache: pages that need cursors
        const missingPages = new Set<number>();
        for (let page = startPage; page <= endPage; page++) {
            if (!cursorCache.getCursor(mode, page, searchTermNormalized)) {
                missingPages.add(page);
            }
        }

        // If all cursors are already cached, just mark as prefetched and return
        if (missingPages.size === 0) {
            console.debug(`[Cursor] All cursors for pages ${startPage}-${endPage} already cached. Skipping fetch.`);
            cursorCache.markPrefetchedAround(mode, currentPage, searchTermNormalized);
            return;
        }

        const docsToFetch = (endPage - startPage + 1) * ITEMS_PER_PAGE;

        console.debug(
            `[Cursor] Prefetching pages ${startPage}-${endPage} (${direction}). ` +
            `${missingPages.size} pages missing, ${docsToFetch} docs to fetch`
        );

        let prefetchQuery: Query;
        let allDocs: DocumentData[];
        let fetchedFromStart = false;

        // Execute backward or forward fetch based on direction
        let isBackwardFetch = false;
        if (useBackwardFetch) {
            // Attempt backward fetch using endBefore + limitToLast
            const cursorPage = endPage; // Use cursor at endPage for backward fetch
            const cursorDocId = cursorCache.getCursor(mode, cursorPage, searchTermNormalized);

            if (cursorDocId) {
                try {
                    console.debug(`[Cursor] Using backward fetch with endBefore cursor from page ${cursorPage}`);
                    const cursorDocRef = doc(playersCollection, cursorDocId);
                    const cursorSnapshot = await getDoc(cursorDocRef);
                    reads += 1;

                    prefetchQuery = query(baseQuery, endBefore(cursorSnapshot), limitToLast(docsToFetch));
                    const snapshot = await getDocs(prefetchQuery);
                    reads += snapshot.docs.length;
                    allDocs = snapshot.docs;
                    isBackwardFetch = true;
                } catch (error) {
                    console.warn(`[Cursor] Backward fetch failed, falling back to forward fetch:`, error);
                    // Fallback to forward fetch
                    ({ allDocs, reads: reads, fetchedFromStart } = await executeForwardFetch(
                        baseQuery, startPage, endPage, mode, searchTermNormalized, reads
                    ));
                }
            } else {
                console.debug(`[Cursor] No cursor for page ${cursorPage}, falling back to forward fetch`);
                // Fallback to forward fetch
                ({ allDocs, reads: reads, fetchedFromStart } = await executeForwardFetch(
                    baseQuery, startPage, endPage, mode, searchTermNormalized, reads
                ));
            }
        } else {
            // Forward fetch
            ({ allDocs, reads: reads, fetchedFromStart } = await executeForwardFetch(
                baseQuery, startPage, endPage, mode, searchTermNormalized, reads
            ));
        }

        // Cache cursors for the fetched pages
        if (isBackwardFetch) {
            // For backward fetch: documents are in correct order (startPage -> endPage-1)
            // endBefore excludes the cursor document, so we have pages startPage to endPage-1
            console.debug(`[Cursor] Caching cursors for backward fetch: ${allDocs.length} docs fetched`);

            for (let i = 0; i < allDocs.length; i++) {
                // Calculate page number: startPage + floor(i / ITEMS_PER_PAGE)
                const pageNumber = startPage + Math.floor(i / ITEMS_PER_PAGE);

                // Cache cursor at end of each page
                if ((i + 1) % ITEMS_PER_PAGE === 0 && pageNumber <= endPage - 1) {
                    if (missingPages.has(pageNumber)) {
                        cursorCache.setCursor(mode, pageNumber, allDocs[i].id, searchTermNormalized);
                        console.debug(`[Cursor] Cached cursor for page ${pageNumber} (backward fetch)`);
                        missingPages.delete(pageNumber);
                    }
                }
            }
        } else {
            // For forward fetch
            const docOffset = fetchedFromStart ? (startPage - 1) * ITEMS_PER_PAGE : 0;

            for (let i = docOffset; i < allDocs.length; i++) {
                const pageNumber = Math.floor(i / ITEMS_PER_PAGE) + 1;

                // Cache cursor at end of each page within target range
                if ((i + 1) % ITEMS_PER_PAGE === 0 && pageNumber >= startPage && pageNumber <= endPage) {
                    if (missingPages.has(pageNumber)) {
                        cursorCache.setCursor(mode, pageNumber, allDocs[i].id, searchTermNormalized);
                        missingPages.delete(pageNumber);
                    }
                }
            }
        }

        // Mark this page range as prefetched
        cursorCache.markPrefetchedAround(mode, currentPage, searchTermNormalized);

        const stats = cursorCache.getStats(mode, searchTermNormalized);
        console.debug(
            `[Cursor] Prefetch complete: ${stats.totalCursors} cursors cached (${missingPages.size} pages still missing)`
        );
    } catch (error) {
        console.error(`[Cursor] Error prefetching cursors:`, error);
    }
    logFirestoreReads('prefetchCursorsAround', reads);  // Log total reads for this operation
}

/**
 * HELPER FUNCTION: Execute forward fetch with cursor-based pagination
 * 
 * Returns fetched documents and read count
 */
async function executeForwardFetch(
    baseQuery: Query,
    startPage: number,
    endPage: number,
    mode: RankingCriteria,
    searchTermNormalized: string | undefined,
    currentReads: number
): Promise<{ allDocs: DocumentData[], reads: number, fetchedFromStart: boolean }> {
    let reads = currentReads;
    let fetchedFromStart = false;
    let prefetchQuery: Query;

    const docsToFetch = (endPage - startPage + 1) * ITEMS_PER_PAGE;

    if (startPage > 1) {
        // Try to use cursor from page before startPage
        const anchorPage = startPage - 1;
        const anchorCursorDocId = cursorCache.getCursor(mode, anchorPage, searchTermNormalized);

        if (anchorCursorDocId) {
            console.debug(`[Cursor] Using forward fetch with startAfter cursor from page ${anchorPage}`);
            const cursorDocRef = doc(playersCollection, anchorCursorDocId);
            const cursorSnapshot = await getDoc(cursorDocRef);
            reads += 1;
            prefetchQuery = query(baseQuery, startAfter(cursorSnapshot), limit(docsToFetch + 1));
        } else {
            // No cursor available, fetch from beginning
            console.debug(`[Cursor] No cursor for page ${anchorPage}, fetching from beginning`);
            fetchedFromStart = true;
            const docsFromStart = endPage * ITEMS_PER_PAGE;
            prefetchQuery = query(baseQuery, limit(docsFromStart + 1));
        }
    } else {
        // Starting from page 1
        console.debug(`[Cursor] Fetching from page 1 (start)`);
        prefetchQuery = query(baseQuery, limit(docsToFetch + 1));
    }

    const snapshot = await getDocs(prefetchQuery);
    reads += snapshot.docs.length;
    const allDocs = snapshot.docs;

    return { allDocs, reads, fetchedFromStart };
}

// Main: Fetch page with cursor-based random access
export async function getPaginatedLeaderboard(
    pageNumber: number = 1,
    mode: RankingCriteria = RankingCriteria.Disinformer,
    searchTerm?: string
): Promise<LeaderboardPageResult> {
    let reads = 0;  // Local counter for this function
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

        // Step 4: Prefetch cursors around current page (limited by fetching window)
        await prefetchCursorsAround(baseQuery, totalPages, pageNumber, mode, searchTermNormalized);

        // Also make sure last page cursor is prefetched for random access
        prefetchLastPageCursor(baseQuery, totalPages, mode, searchTermNormalized).catch(err =>
            console.error('[Cursor] Failed to prefetch last page cursor:', err)
        );

        // Step 5: Get cursor for this page (O(1) lookup if prefetched)
        let pageQuery = addPaginationLimitToQuery(baseQuery, ITEMS_PER_PAGE + 1);
        let fetchedFromStart = false;

        if (pageNumber > 1) {
            const cursorDocId = cursorCache.getCursor(mode, pageNumber - 1, searchTermNormalized);

            if (cursorDocId) {
                const cursorDocRef = doc(playersCollection, cursorDocId);
                const cursorSnapshot = await getDoc(cursorDocRef);
                reads += 1;
                if (cursorSnapshot.exists()) {
                    pageQuery = query(baseQuery, startAfter(cursorSnapshot), limit(ITEMS_PER_PAGE + 1));
                } else {
                    console.warn(`[Cursor] Cursor document ${cursorDocId} does not exist. Falling back to fetch from beginning.`);
                    // Fallback: fetch from beginning
                    fetchedFromStart = true;
                    const docsFromStart = pageNumber * ITEMS_PER_PAGE;
                    pageQuery = query(baseQuery, limit(docsFromStart + 1));
                }
            } else {
                console.warn(`[Cursor] Cursor not found for page ${pageNumber - 1}. Falling back to fetch from beginning.`);
                // Fallback: fetch from beginning (should rarely happen after prefetch)
                fetchedFromStart = true;
                const docsFromStart = pageNumber * ITEMS_PER_PAGE;
                pageQuery = query(baseQuery, limit(docsFromStart + 1));
            }
        }

        // Step 6: Execute the page query
        const querySnapshot = await getDocs(pageQuery);
        reads += querySnapshot.docs.length;  // Count the getDocs reads
        const allDocs = querySnapshot.docs;

        // Step 7: Get the current page (slice based on whether we fetched from start)
        const startIdx = fetchedFromStart ? (pageNumber - 1) * ITEMS_PER_PAGE : 0;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        const pageSlice = allDocs.slice(startIdx, endIdx);

        // Transform documents to Player objects
        const players: Player[] = pageSlice.map(serializePlayer);

        // Step 8: Record page access for navigation direction detection
        cursorCache.recordPageAccess(mode, pageNumber, searchTermNormalized);

        // Step 9: Log cache stats for debugging
        const stats = cursorCache.getStats(mode, searchTermNormalized);
        console.debug(
            `[Leaderboard] Page ${pageNumber} fetched. Cache: ${stats.totalCursors} cursors. TTL: ${Math.round(stats.cacheAge / 1000)}s`
        );

        logFirestoreReads('getPaginatedLeaderboard', reads);  // Log total reads for this operation

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

/**
 * Real-time listener for entire leaderboard with pagination
 * Uses cursor-based pagination to stay consistent with getPaginatedLeaderboard
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

    // Build the base query for real-time listening
    let q: Query = buildBaseQueryWithoutPagination(mode, searchTermNormalized);

    // Set up real-time listener on the base query (no pagination limit)
    // This triggers whenever ANY player document changes
    const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
            try {
                // Get total count from the snapshot
                const allPlayers = snapshot.docs.map(serializePlayer);
                const totalPlayers = allPlayers.length;
                const totalPages = Math.ceil(totalPlayers / ITEMS_PER_PAGE) || 1;
                const validPageNumber = Math.min(pageNumber, totalPages);

                // Update cursor cache with all current positions for consistency
                // This ensures subsequent cursor-based fetches are consistent
                snapshot.docs.forEach((doc, index) => {
                    const pageForDoc = Math.floor(index / ITEMS_PER_PAGE) + 1;
                    if (index % ITEMS_PER_PAGE === ITEMS_PER_PAGE - 1) {
                        // Store the cursor at page boundaries
                        cursorCache.setCursor(mode, pageForDoc, doc.id, searchTermNormalized);
                    }
                });

                // Get the page slice from the current snapshot
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