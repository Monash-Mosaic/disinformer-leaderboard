import { Suspense } from 'react';
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import LeaderboardSkeleton from "@/components/leaderboard/LeaderboardSkeleton";
import { RankingCriteria } from "@/types/leaderboard";

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
 * Leaderboard Server Component
 * 
 * This is an async Server Component that handles the leaderboard page.
 * It extracts search parameters from the URL and passes them as initial
 * values to the client component.
 * 
 * Benefits of this pattern:
 * - SEO-friendly: Initial data can be server-rendered
 * - Shareable URLs: All state is preserved in URL parameters
 * - Progressive enhancement: Works without JavaScript
 * - Streaming: Uses Suspense for better loading experience
 * 
 * @param searchParams - Promise containing URL parameters (Next.js 15+ pattern)
 */
export default async function Leaderboard({
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
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Suspense boundary provides loading state while fetching data */}
                {/* Shows skeleton UI during initial load and navigation */}
                <Suspense fallback={<LeaderboardSkeleton />}>
                    <LeaderboardTable
                        initialPage={page}
                        initialMode={mode}
                        initialSearch={search}
                    />
                </Suspense>
            </div>
        </div>
    );
}