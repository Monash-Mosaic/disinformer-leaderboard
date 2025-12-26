import { RankingCriteria } from "@/types/leaderboard";
import { LeaderboardPageResult } from "@/types/pagination";
import { query, orderBy, where, onSnapshot, Query } from "firebase/firestore";
import { playersCollection } from "@/utils/firebase.client";

/**
 * Client-side real-time service for offset-based leaderboard
 *
 * This service provides real-time updates by listening to the entire leaderboard
 * and triggering re-fetches when data changes. Unlike cursor-based, it doesn't
 * process the full snapshot client-side but instead notifies when updates occur.
 */

/**
 * Subscribes to real-time updates for the leaderboard
 *
 * When any player data changes, this triggers a callback to re-fetch the current page.
 * This is more efficient than processing the full snapshot client-side for offset-based pagination.
 *
 * @param mode - Ranking mode (Disinformer or Netizen)
 * @param searchTerm - Optional search filter
 * @param onLeaderboardChange - Callback fired when leaderboard data changes
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToLeaderboardChanges(
    mode: RankingCriteria,
    searchTerm: string | undefined,
    onLeaderboardChange: () => void,
    onError: (error: Error) => void
): () => void {
    // Normalize search term
    const searchTermNormalized = searchTerm ? searchTerm.trim().toLowerCase() : undefined;

    // Build the base query (same as server-side but without pagination)
    const sortField = mode === RankingCriteria.Netizen
        ? 'totalNetizenPoints'
        : 'totalDisinformerPoints';

    let baseQuery: Query = query(
        playersCollection,
        orderBy(sortField, 'desc'),
        orderBy('totalGamesPlayed', 'asc'),
        orderBy('username_lowercase', 'asc')
    );

    // Add search filter if provided
    if (searchTermNormalized) {
        baseQuery = query(
            baseQuery,
            where('username_lowercase', '>=', searchTermNormalized),
            where('username_lowercase', '<=', searchTermNormalized + '\uf8ff')
        );
    }

    // Flag to ignore the initial snapshot (onSnapshot fires immediately)
    let isInitialSnapshot = true;

    // Set up real-time listener
    const unsubscribe = onSnapshot(
        baseQuery,
        (snapshot) => {
            // Skip the initial snapshot to avoid unnecessary re-fetch
            if (isInitialSnapshot) {
                isInitialSnapshot = false;
                return;
            }

            // Any change to the snapshot means the leaderboard has changed
            // Trigger re-fetch of current page data
            onLeaderboardChange();
        },
        (error) => {
            onError(new Error(`Real-time listener error: ${error.message}`));
        }
    );

    return unsubscribe;
}