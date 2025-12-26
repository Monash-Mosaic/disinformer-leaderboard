'use server';

import { RankingCriteria } from "@/types/leaderboard";
import { LeaderboardPageResult } from "@/types/pagination";
import { getPaginatedLeaderboard } from "@/services/leaderboard-offset-service";

/**
 * Server Action for fetching paginated leaderboard data
 * This runs on the server and avoids exposing firebase-admin to the client
 */
export async function fetchLeaderboardAction(
    page: number,
    mode: RankingCriteria,
    searchTerm: string
): Promise<LeaderboardPageResult> {
    return getPaginatedLeaderboard(page, mode, searchTerm);
}
