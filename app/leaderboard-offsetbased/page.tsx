import { Suspense } from 'react';
import LeaderboardSkeleton from "@/components/leaderboard/LeaderboardSkeleton";

/** Avoid Firestore at build time; data is fetched on each request. */
export const dynamic = 'force-dynamic';
import { RankingCriteria } from "@/types/leaderboard";
import LeaderboardTableOffsetBased from '@/components/leaderboard/LeaderboardTableOffsetBased';

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
 * Offset-Based Leaderboard with Real-Time Updates
 *
 * Firestore reads run in the browser via the Firebase client SDK so
 * security rules are enforced. The server component only parses URL state.
 */
export default async function LeaderboardOffsetBased({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;

    const page = Number(params.page) || 1;
    const mode = (params.mode as RankingCriteria) || RankingCriteria.Disinformer;
    const search = params.search || '';

    return (
        <div className="flex flex-col min-h-screen bg-[#ffffef]">
            <div className="grow pb-8 px-4">
                <div className="max-w-[1300px] mx-auto">
                    <Suspense fallback={<LeaderboardSkeleton />}>
                        <LeaderboardTableOffsetBased
                            initialPage={page}
                            initialMode={mode}
                            initialSearch={search}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
