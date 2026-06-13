import {
    query,
    orderBy,
    where,
    limit,
    getDocs,
    getCountFromServer,
    Query,
    DocumentData,
} from "firebase/firestore";
import { playersCollection } from "@/utils/firebase.client";
import { RankingCriteria, Player } from "@/types/leaderboard";
import { LeaderboardPageResult } from "@/types/pagination";

/**
 * OFFSET-BASED PAGINATION SERVICE
 *
 * This service implements offset-based pagination for the Firestore leaderboard.
 * Unlike cursor-based pagination, this approach uses limit + offset to fetch pages.
 *
 */

const PAGE_SIZE = 10;

// Global counter for Firestore reads (similar to cursor service)
let totalFirestoreReads = 0;

/**
 * Helper to log Firestore read counts for cost estimation
 * Similar to the cursor-based service implementation
 */
function logFirestoreReads(operation: string, readCount: number) {
    totalFirestoreReads += readCount;
    console.log(`[Firestore Reads - Offset] ${operation}: ${readCount} documents read (Total: ${totalFirestoreReads})`);
}

// Helper: Normalize search term
function searchTermNormalize(term: string): string {
    return term.trim().toLowerCase();
}

function buildSortedPlayersQuery(
    mode: RankingCriteria,
    searchTerm: string
): Query {
    const sortField = mode === RankingCriteria.Netizen
        ? 'totalNetizenPoints'
        : 'totalDisinformerPoints';

    let q: Query = playersCollection;

    const searchTermNormalized = searchTerm ? searchTermNormalize(searchTerm) : undefined;

    if (searchTermNormalized) {
        q = query(
            q,
            where('username_lowercase', '>=', searchTermNormalized),
            where('username_lowercase', '<=', searchTermNormalized + '\uf8ff')
        );
    }

    return query(
        q,
        orderBy(sortField, 'desc'),
        orderBy('totalGamesPlayed', 'asc'),
        orderBy('username_lowercase', 'asc')
    );
}

function serializePlayer(doc: DocumentData): Player {
    const data = doc.data();
    return {
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        lastGamePlayedAt: data.lastGamePlayedAt?.toDate?.()?.toISOString() ?? null,
        totalDisinformerPoints: data.totalDisinformerPoints ?? 0,
        totalNetizenPoints: data.totalNetizenPoints ?? 0,
        id: doc.id,
    } as Player;
}

/**
 * Fetches a single page of leaderboard data using offset-based pagination
 *
 * How it works:
 * 1. Query all matching documents with ordering
 * 2. Skip (offset) the first N * pageSize documents
 * 3. Limit results to PAGE_SIZE
 * 4. Calculate pagination metadata
 *
 * Firestore Reads:
 * - Always charges for reading all documents up to current page + page size
 * - Page 1: reads ~10 docs
 * - Page 10: reads ~100 docs
 * - Page 100: reads ~1000 docs (expensive!)
 *
 * @param page - Page number (1-based)
 * @param mode - Ranking mode (Disinformer or Netizen)
 * @param searchTerm - Optional search filter (username prefix matching)
 * @returns LeaderboardPageResult with players and pagination metadata
 */
export async function getPaginatedLeaderboard(
    page: number = 1,
    mode: RankingCriteria = RankingCriteria.Disinformer,
    searchTerm: string = ''
): Promise<LeaderboardPageResult> {
    try {
        // Validate and normalize inputs
        const normalizedPage = Math.max(1, Math.floor(page || 1));

        const sortedQuery = buildSortedPlayersQuery(mode, searchTerm);

        const countSnapshot = await getCountFromServer(sortedQuery);
        const totalDocuments = countSnapshot.data().count;

        // Log the count query read (count queries also count as reads)
        logFirestoreReads('getTotalCount', 1);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalDocuments / PAGE_SIZE);

        // Adjust page if it exceeds total pages (can happen with real-time updates)
        const validPage = Math.min(normalizedPage, Math.max(1, totalPages));

        const hasNextPage = validPage < totalPages;
        const hasPrevPage = validPage > 1;

        // Calculate offset (skip)
        const pageOffset = (validPage - 1) * PAGE_SIZE;

        // Client SDK has no offset(); fetch through the page boundary and slice.
        const snapshot =
            totalDocuments === 0
                ? null
                : await getDocs(
                    query(sortedQuery, limit(pageOffset + PAGE_SIZE))
                );

        const pageDocs = snapshot?.docs.slice(pageOffset) ?? [];

        // Log the data fetch reads (billed for all docs through the page boundary)
        logFirestoreReads('getPageData', snapshot?.docs.length ?? 0);

        const players = pageDocs.map(serializePlayer);

        return {
            players,
            totalPages,
            currentPage: validPage,
            hasNextPage,
            hasPrevPage,
            cursors: {}, // Offset-based doesn't use cursors
        };
    } catch (error) {
        console.error('[Offset Service] Error fetching paginated leaderboard:', error);
        throw error instanceof Error
            ? error
            : new Error('Failed to fetch leaderboard data');
    }
}

/**
 * Gets the total count of documents matching the given criteria
 *
 * This uses the efficient count() method which doesn't read the actual document contents.
 * Much more cost-effective than traditional count queries.
 *
 * Use cases:
 * - Calculate total pages on initial load
 * - Verify search results count
 *
 * @param mode - Ranking mode
 * @param searchTerm - Optional search filter
 * @returns Total number of matching documents
 */
export async function getTotalLeaderboardCount(
    mode: RankingCriteria = RankingCriteria.Disinformer,
    searchTerm: string = ''
): Promise<number> {
    try {
        const sortedQuery = buildSortedPlayersQuery(mode, searchTerm);

        const snapshot = await getCountFromServer(sortedQuery);
        return snapshot.data().count;
    } catch (error) {
        console.error('[Offset Service] Error getting total count:', error);
        throw error instanceof Error
            ? error
            : new Error('Failed to get total count');
    }
}
