import { Player, RankingCriteria } from "@/types/leaderboard";
import { playersCollection } from "@/utils/firebase.client";
import {
    DocumentData,
    Query,
    getDocs,
    query,
    orderBy,
    limit,
    startAfter,
    where,
    QueryDocumentSnapshot
} from "firebase/firestore";

/**
 * Result object returned from paginated player queries
 * Contains both the data and metadata needed for cursor-based pagination
 */
export interface PaginatedResult {
    players: Player[];                      // Array of player objects for current page
    lastDoc: QueryDocumentSnapshot | null;  // Firestore document snapshot used as cursor for next page
    hasMore: boolean;                       // Flag indicating if more results exist
    total: number;                          // Total count of documents in current query (not overall total)
}

/**
 * Fetches a paginated list of players from Firestore with optional search filtering
 * 
 * This function implements cursor-based pagination using Firestore's startAfter() method,
 * which is more efficient than offset-based pagination for large datasets.
 * 
 * How cursor-based pagination works:
 * 1. First page: Pass null for lastDocSnapshot
 * 2. Subsequent pages: Pass the lastDoc from previous result as lastDocSnapshot
 * 3. Firestore starts returning documents after that cursor position
 * 
 * @param mode - Ranking criteria (Disinformer or Netizen) determines sort field
 * @param pageSize - Number of items to fetch per page (default: 10)
 * @param lastDocSnapshot - Document snapshot to start after (for pagination)
 * @param searchTerm - Optional username search filter (prefix matching only)
 * @returns PaginatedResult with players array, cursor, and pagination metadata
 * 
 * @example
 * // Fetch first page
 * const page1 = await getPlayers(RankingCriteria.Disinformer, 10);
 * 
 * // Fetch second page using cursor from first page
 * const page2 = await getPlayers(RankingCriteria.Disinformer, 10, page1.lastDoc);
 */
export async function getPlayers(
    mode: RankingCriteria = RankingCriteria.Disinformer,
    pageSize: number = 10,
    lastDocSnapshot?: QueryDocumentSnapshot | null,
    searchTerm?: string
): Promise<PaginatedResult> {
    try {
        // Determine which points field to sort by based on ranking mode
        const sortField = mode === RankingCriteria.Netizen
            ? 'totalNetizenPoints'
            : 'totalDisinformerPoints';

        // Start with base collection reference
        let q: Query = playersCollection;

        // Add search filter if provided
        // IMPORTANT: Firestore doesn't support native full-text search
        // This only works for exact prefix matches (e.g., "john" matches "john123")
        // For production full-text search, consider:
        // - Algolia: https://www.algolia.com/
        // - Typesense: https://typesense.org/
        // - Firebase Extensions: https://firebase.google.com/products/extensions/firestore-algolia-search
        if (searchTerm) {
            q = query(
                q,
                where('username', '>=', searchTerm),
                // '\uf8ff' is a very high Unicode character, creates range for prefix matching
                where('username', '<=', searchTerm + '\uf8ff')
            );
        }

        // Build query with ordering and pagination
        // NOTE: orderBy order matters! Must match composite index in Firestore
        q = query(
            q,
            orderBy(sortField, 'desc'),     // Primary sort: highest points first
            orderBy('username', 'asc'),     // Secondary sort: alphabetical for consistent ordering
            limit(pageSize + 1)             // Fetch one extra to detect if more pages exist
        );

        // Apply cursor for pagination if provided
        // startAfter() tells Firestore to skip documents up to and including this snapshot
        if (lastDocSnapshot) {
            q = query(q, startAfter(lastDocSnapshot));
        }

        // Execute the query
        const querySnapshot = await getDocs(q);

        // Detect if more pages exist by checking if we got the extra document
        // We requested pageSize + 1, so if we got more than pageSize, there's a next page
        const hasMore = querySnapshot.docs.length > pageSize;

        // Trim the extra document if present (we only want pageSize results)
        const docs = hasMore ? querySnapshot.docs.slice(0, pageSize) : querySnapshot.docs;

        // Transform Firestore documents into Player objects
        const players = docs.map((doc: DocumentData) => {
            const data = doc.data();
            return {
                ...data,
                // Ensure point fields exist (default to 0 if missing)
                totalDisinformerPoints: data.totalDisinformerPoints ?? 0,
                totalNetizenPoints: data.totalNetizenPoints ?? 0,
                id: doc.id,  // Include Firestore document ID for unique keys
            } as Player;
        });

        // Store the last document snapshot for use as cursor in next page request
        // This is critical for cursor-based pagination
        const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;

        return {
            players,        // The player data for this page
            lastDoc,        // Cursor for next page
            hasMore,        // Whether more pages exist
            total: querySnapshot.size,  // Number of docs returned (not overall count)
        };
    } catch (error) {
        // Re-throw error to be handled by caller
        throw error;
    }
}

/**
 * Pre-fetches document cursors for all pages to enable direct page jumping
 * 
 * This solves Firestore's sequential pagination limitation by:
 * 1. Fetching all documents in a single query (only reads cursor positions)
 * 2. Storing cursor positions for each page boundary
 * 3. Enabling instant navigation to any page
 * 
 * Trade-off: Initial fetch reads all documents, but enables better UX
 * Best for datasets under 10,000 records
 * 
 * @param mode - Current ranking mode
 * @param searchTerm - Current search filter
 * @param totalCount - Total number of documents
 * @param pageSize - Items per page
 * @returns Map of page numbers to their starting cursors
 */
export async function prefetchPageCursors(
    mode: RankingCriteria,
    searchTerm: string,
    totalCount: number,
    pageSize: number
): Promise<Map<number, QueryDocumentSnapshot | null>> {
    const cursors = new Map<number, QueryDocumentSnapshot | null>();
    cursors.set(1, null); // First page has no cursor (starts from beginning)
    
    // If only one page, no need to fetch anything
    if (totalCount <= pageSize) {
        return cursors;
    }
    
    const sortField = mode === RankingCriteria.Netizen 
        ? 'totalNetizenPoints' 
        : 'totalDisinformerPoints';
    
    // Build query to fetch all documents
    let q: Query = playersCollection;
    
    if (searchTerm) {
        q = query(
            q,
            where('username', '>=', searchTerm),
            where('username', '<=', searchTerm + '\uf8ff')
        );
    }
    
    q = query(
        q,
        orderBy(sortField, 'desc'),
        orderBy('username', 'asc'),
        limit(totalCount) // Fetch all documents to get cursor positions
    );
    
    const snapshot = await getDocs(q);
    
    // Store cursor for each page boundary
    // Page 2 starts after document at index (pageSize - 1)
    // Page 3 starts after document at index (2 * pageSize - 1), etc.
    const totalPages = Math.ceil(totalCount / pageSize);
    for (let page = 2; page <= totalPages; page++) {
        const cursorIndex = (page - 1) * pageSize - 1;
        if (cursorIndex < snapshot.docs.length) {
            cursors.set(page, snapshot.docs[cursorIndex]);
        }
    }
    
    return cursors;
}

/**
 * Get total count of players matching the given criteria
 * 
 * WARNING: This is an EXPENSIVE operation!
 * - Firestore charges for every document read
 * - For counting, Firestore still reads metadata for all matching docs
 * 
 * Recommendations:
 * - Cache this value aggressively (done automatically in the component)
 * - Only call on initial load for each mode/search combination
 * - Consider maintaining a counter document that increments/decrements
 * 
 * @param mode - Ranking criteria to count for
 * @param searchTerm - Optional search filter
 * @returns Total number of matching documents
 */
export async function getTotalCount(
    mode: RankingCriteria,
    searchTerm?: string
): Promise<number> {
    try {
        // Determine sort field based on mode (needed for consistent query)
        const sortField = mode === RankingCriteria.Netizen
            ? 'totalNetizenPoints'
            : 'totalDisinformerPoints';

        // Build query (same filters as getPlayers but without limit)
        let q: Query = playersCollection;

        // Apply search filter if provided
        if (searchTerm) {
            q = query(
                q,
                where('username', '>=', searchTerm),
                where('username', '<=', searchTerm + '\uf8ff')
            );
        }

        // Add ordering to match the main query structure
        q = query(
            q,
            orderBy(sortField, 'desc'),
            orderBy('username', 'asc')
        );

        // Fetch all matching documents (expensive!)
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        throw error;
    }
}