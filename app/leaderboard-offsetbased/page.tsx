import { Suspense } from 'react';
import LeaderboardSkeleton from "@/components/leaderboard/LeaderboardSkeleton";
import { RankingCriteria } from "@/types/leaderboard";
import LeaderboardTableOffsetBased from '@/components/leaderboard/LeaderboardTableOffsetBased';
import { getPaginatedLeaderboard } from '@/services/leaderboard-offset-service';
import Footer from '@/components/Footer';

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
 * Offset-Based Leaderboard Server Component with Real-Time Updates
 *
 * This route demonstrates offset-based pagination with hybrid real-time updates.
 * Uses the leaderboard-offset-service.ts for initial server-side data fetching
 * and client-side Firebase SDK for real-time subscriptions.
 *
 * Features:
 * - Offset-based pagination (simpler than cursor-based)
 * - Hybrid real-time updates: server actions for data + client listeners for change detection
 * - Search filtering with dynamic pagination updates
 * - URL state preservation for shareable links
 * - Server-side rendering benefits maintained
 *
 * Trade-offs:
 * + Simpler implementation than cursor-based
 * + No cursor caching complexity
 * + Real-time updates without full client processing
 * - Less efficient for large page numbers (fetches all docs up to current page)
 * - Higher Firestore read costs for pages further in the list
 * - Client-side Firebase SDK required
 *
 * Best for:
 * - Small to medium datasets
 * - Use cases where users typically stay on first few pages
 * - Situations where real-time updates are important but server consistency is maintained
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
        <div className="flex flex-col min-h-screen bg-[#ffffef]">
            <div className="grow pb-8 px-4">
                <div className="max-w-[1300px] mx-auto">
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
            <Footer />
        </div>
    );
}
