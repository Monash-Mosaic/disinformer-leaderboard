import { Suspense } from "react";
import LeaderboardSkeleton from "@/components/leaderboard/LeaderboardSkeleton";
import LeaderboardTableOffsetBased from "@/components/leaderboard/LeaderboardTableOffsetBased";
import { RankingCriteria } from "@/types/leaderboard";
import { getPaginatedLeaderboard } from "@/services/leaderboard-offset-service";

/**
 * Interface for URL search parameters used in leaderboard navigation
 * These params enable shareable URLs with state preservation
 */
interface SearchParams {
  page?: string; // Current page number (1-based)
  mode?: string; // Ranking mode: 'disinformer' or 'netizen'
  search?: string; // Search term for filtering players
}

export default async function LeaderboardOffsetBased({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const mode = (params.mode as RankingCriteria) || RankingCriteria.Disinformer;
  const search = params.search || "";

  const dataPromise = getPaginatedLeaderboard(page, mode, search);

  return (
    <div className="flex flex-col min-h-screen bg-[#ffffef]">
      <div className="grow pb-8 px-4">
        <div className="max-w-[1300px] mx-auto">
          <Suspense fallback={<LeaderboardSkeleton mode={mode} />}>
            <LeaderboardTableOffsetBased
              dataPromise={dataPromise}
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