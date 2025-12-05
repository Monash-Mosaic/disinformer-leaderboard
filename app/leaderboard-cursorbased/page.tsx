import { Suspense } from 'react';
import LeaderboardSkeleton from "@/components/leaderboard/LeaderboardSkeleton";
import { RankingCriteria } from "@/types/leaderboard";
import LeaderboardTableCursorBased from '@/components/leaderboard/LeaderboardTableCursorBased';

/**
 * Interface for URL search parameters used in leaderboard navigation
 * These params enable shareable URLs with state preservation
 */
interface SearchParams {
    page?: string;      // Current page number (1-based)
    mode?: string;      // Ranking mode: 'disinformer' or 'netizen'
    search?: string;    // Search term for filtering players
}

/**
 * Cursor-Based Leaderboard Server Component
 *
 * This route demonstrates cursor-based pagination with random access.
 * Uses the leaderboard-service.ts implementation with cursor caching.
 *
 * Features:
 * - Cursor-based pagination for efficient Firestore queries
 * - Random access to any page (jump from page 1 to page 10)
 * - Search filtering with dynamic pagination updates
 * - URL state preservation for shareable links
 *
 * @param searchParams - Promise containing URL parameters (Next.js 15+ pattern)
 */
export default async function LeaderboardCursorBased({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    // Await the searchParams promise (Next.js 15+ async searchParams)
    const params = await searchParams;

    // Extract and normalize parameters with sensible defaults
    const page = Number(params.page) || 1;  // Default to first page
    const mode = (params.mode as RankingCriteria) || RankingCriteria.Disinformer;  // Default mode
    const search = params.search || '';  // Empty string if no search term

    return (
        // Suspense boundary provides loading state while fetching data
        // Shows skeleton UI during initial load and navigation
        <Suspense fallback={<LeaderboardSkeleton />}>
            <LeaderboardTableCursorBased
                initialPage={page}
                initialMode={mode}
                initialSearch={search}
            />
        </Suspense>
    );
}