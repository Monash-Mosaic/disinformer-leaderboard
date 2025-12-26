import { Suspense } from 'react';
import LeaderboardSkeleton from "@/components/leaderboard/LeaderboardSkeleton";
import { RankingCriteria } from "@/types/leaderboard";
import LeaderboardTableOffsetBased from '@/components/leaderboard/LeaderboardTableOffsetBased';
import { getPaginatedLeaderboard } from '@/services/leaderboard-offset-service';

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
 * Offset-Based Leaderboard Server Component
 *
 * This route demonstrates offset-based pagination.
 * Uses the leaderboard-offset-service.ts implementation.
 *
 * Features:
 * - Offset-based pagination (simpler than cursor-based)
 * - Search filtering with dynamic pagination updates
 * - URL state preservation for shareable links
 * - Data fetched on server, passed to client component via promise
 *
 * Trade-offs:
 * + Simpler implementation than cursor-based
 * + No cursor caching complexity
 * - Less efficient for large page numbers (fetches all docs up to current page)
 * - Higher Firestore read costs for pages further in the list
 *
 * Best for:
 * - Small to medium datasets
 * - Use cases where users typically stay on first few pages
 * - Situations where simplicity is preferred over optimization
 *
 * @param searchParams - Promise containing URL parameters (Next.js 15+ pattern)
 */
export default async function LeaderboardOffsetBased({
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

    // Fetch data from the leaderboard service
    // This promise will be consumed by the client component using the "use" hook
    const dataPromise = getPaginatedLeaderboard(page, mode, search);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Suspense boundary provides loading state while fetching data */}
                {/* Shows skeleton UI during initial load and navigation */}
                <Suspense fallback={<LeaderboardSkeleton />}>
                    <LeaderboardTableOffsetBased
                        dataPromise={dataPromise}
                        initialPage={page}
                        initialMode={mode}
                        initialSearch={search}
                    />
                </Suspense>
            </div>
        </div>
    );
}
