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
            where('username_lower', '>=', searchTermNormalized),
            where('username_lower', '<=', searchTermNormalized + '\uf8ff')
        );
    }

    // Apply ordering (no limit here)
    q = query(
        q,
        orderBy(rankingField, 'desc'),
        orderBy('totalGamesPlayed', 'desc'),  // Changed to desc (more games = better)
        orderBy('username_lower', 'asc')
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
        let pageQuery = addPaginationLimitToQuery(baseQuery, ITEMS_PER_PAGE + 1);

        // Step 4: Apply cursor to query for pagination (with random access)
        if (pageNumber > 1) {
            const cursorDocId = cursorCache.getCursor(mode, pageNumber - 1, searchTermNormalized);

            if (cursorDocId) {
                // Cache hit: jump directly to page
                const cursorDocRef = doc(playersCollection, cursorDocId);
                const cursorSnapshot = await getDoc(cursorDocRef);
                pageQuery = query(pageQuery, startAfter(cursorSnapshot));
            } else {
                // Cache miss: sequentially read pages (fallback)
                // Read exactly (pageNumber - 1) * ITEMS_PER_PAGE documents to skip
                const skipQuery = addPaginationLimitToQuery(
                    baseQuery,
                    (pageNumber - 1) * ITEMS_PER_PAGE
                );
                const skipSnapshot = await getDocs(skipQuery);

                if (skipSnapshot.docs.length > 0) {
                    const lastDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
                    pageQuery = query(pageQuery, startAfter(lastDoc));

                    // Cache cursor of previous page
                    cursorCache.setCursor(mode, pageNumber - 1, lastDoc.id, searchTermNormalized);
                }
            }
        }

        // Step 5: Execute the page query
        const querySnapshot = await getDocs(pageQuery);
        const allDocs = querySnapshot.docs;

        // Step 6: Transform documents to Player objects
        const players: Player[] = allDocs.slice(0, ITEMS_PER_PAGE).map((doc: DocumentData) => {
            const data = doc.data();
            return {
                ...data,
                totalDisinformerPoints: data.totalDisinformerPoints ?? 0,
                totalNetizenPoints: data.totalNetizenPoints ?? 0,
                id: doc.id,
            } as Player;
        });

        // Step 7: Cache cursors for future navigation
        // Cache current page cursor
        if (players.length > 0) {
            cursorCache.setCursor(mode, pageNumber, players[players.length - 1].id, searchTermNormalized);
        }

        // Cache next page cursor (allowed since base query fetch one extra document)
        if (allDocs.length > ITEMS_PER_PAGE) {
            cursorCache.setCursor(mode, pageNumber + 1, allDocs[ITEMS_PER_PAGE].id, searchTermNormalized);
        }

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