"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPaginatedLeaderboard } from "@/services/leaderboard-service";
import { Player, RankingCriteria } from "@/types/leaderboard";
import { LeaderboardPageResult } from "@/types/pagination";
import LeaderboardSearchBar from "./LeaderboardSearchBar";
import LeaderboardPagination from "./LeaderboardPagination";
import LeaderboardSkeleton from "./LeaderboardSkeleton";
import LeaderboardToggleButton from "./LeaderboardToggleButton";

/**
 * Props for LeaderboardTableCursorBased component
 * These are passed from the Server Component and represent URL state
 */
interface LeaderboardTableCursorBasedProps {
    initialPage?: number;           // Starting page number from URL
    initialMode?: RankingCriteria;  // Initial ranking mode from URL
    initialSearch?: string;         // Initial search term from URL
}

/**
 * LeaderboardTableCursorBased Client Component
 *
 * This component implements cursor-based pagination using the leaderboard-service.ts.
 * Features efficient random access pagination with cursor caching.
 *
 * Key Features:
 * - Cursor-based pagination for Firestore efficiency
 * - Random access to any page (no sequential navigation required)
 * - Search filtering with dynamic pagination updates
 * - URL state synchronization for shareable links
 * - Cursor caching for instant navigation between pages
 */
export default function LeaderboardTableCursorBased({
    initialPage = 1,
    initialMode = RankingCriteria.Disinformer,
    initialSearch = ''
}: LeaderboardTableCursorBasedProps) {
    // Next.js navigation hooks
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Component state
    const [data, setData] = useState<LeaderboardPageResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter/navigation state
    const [mode, setMode] = useState<RankingCriteria>(initialMode);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [inputValue, setInputValue] = useState(initialSearch);
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    /**
     * Updates URL with new state parameters
     *
     * This function synchronizes component state to URL search parameters,
     * enabling shareable links with full state preservation.
     *
     * @param newPage - Page number to navigate to
     * @param newMode - Ranking mode to display
     * @param newSearch - Search term to filter by
     */
    const updateURL = (newPage: number, newMode: RankingCriteria, newSearch: string) => {
        const params = new URLSearchParams(searchParams.toString());

        // Update parameters
        params.set('page', newPage.toString());
        params.set('mode', newMode);

        // Only include search param if not empty (cleaner URLs)
        if (newSearch) {
            params.set('search', newSearch);
        } else {
            params.delete('search');
        }

        // Use startTransition for non-blocking navigation
        startTransition(() => {
            router.push(`/leaderboard-cursorbased?${params.toString()}`, { scroll: false });
        });
    };

    /**
     * Effect: Fetch leaderboard data when page, mode, or search changes
     *
     * Uses the cursor-based leaderboard service for efficient pagination.
     * The service handles cursor caching internally for random access.
     */
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await getPaginatedLeaderboard(currentPage, mode, searchTerm);
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentPage, mode, searchTerm]);

    /**
     * Handles ranking mode toggle (Disinformer <-> Netizen)
     * - Switches between point ranking systems
     * - Resets to page 1 (different data set)
     * - Updates URL to preserve state
     */
    const handleModeToggle = () => {
        const newMode = mode === RankingCriteria.Disinformer
            ? RankingCriteria.Netizen
            : RankingCriteria.Disinformer;
        setMode(newMode);
        setCurrentPage(1);  // Always reset to first page on mode change
        updateURL(1, newMode, searchTerm);
    };

    /**
     * Handles search submission
     * - Applies new search filter
     * - Resets to page 1 (new filtered data set)
     * - Updates URL with search parameter
     */
    const handleSearchSubmit = (term: string) => {
        setSearchTerm(term);
        setCurrentPage(1);  // Reset to first page on new search
        setInputValue(term);
        updateURL(1, mode, term);
    };

    /**
     * Handles page navigation
     * - Updates current page
     * - Preserves mode and search state
     * - Triggers data fetch via useEffect
     */
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateURL(page, mode, searchTerm);
    };

    // Dynamic UI text based on current mode
    const buttonText = mode === RankingCriteria.Disinformer
        ? 'Switch to Netizen Mode'
        : 'Switch to Disinformer Mode';
    const title = mode === RankingCriteria.Disinformer
        ? 'Disinformer Leaderboard (Cursor-Based)'
        : 'Netizen Leaderboard (Cursor-Based)';

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8 text-zinc-900 dark:text-white">
                    {title}
                </h1>

                <LeaderboardSearchBar
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    onSubmit={handleSearchSubmit}
                    disabled={loading || isPending}
                />

                <LeaderboardToggleButton
                    onClick={handleModeToggle}
                    disabled={loading || isPending}
                    text={buttonText}
                />

                {loading || isPending ? (
                    <LeaderboardSkeleton />
                ) : error ? (
                    <p className="text-red-500 text-center">{error}</p>
                ) : data ? (
                    <>
                        {/* Leaderboard Table */}
                        <div className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-lg shadow">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                                        <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">
                                            Place
                                        </th>
                                        <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">
                                            Username
                                        </th>
                                        <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">
                                            Points
                                        </th>
                                        <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">
                                            Games Played
                                        </th>
                                        <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">
                                            Society
                                        </th>
                                        <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">
                                            Branch
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.players.map((player, index) => (
                                        <tr
                                            key={player.id}
                                            className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                                    {(data.currentPage - 1) * 10 + index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-block bg-cyan-400 text-zinc-900 px-4 py-2 rounded-lg font-medium">
                                                    {player.username}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">
                                                {mode === RankingCriteria.Disinformer
                                                    ? player.totalDisinformerPoints
                                                    : player.totalNetizenPoints}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                                                {player.totalGamesPlayed}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                                                {player.society || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                                                {player.branch || "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <LeaderboardPagination
                            currentPage={data.currentPage}
                            totalPages={data.totalPages}
                            onPrev={() => data.hasPrevPage && handlePageChange(data.currentPage - 1)}
                            onNext={() => data.hasNextPage && handlePageChange(data.currentPage + 1)}
                            onPageClick={handlePageChange}
                        />
                    </>
                ) : null}
            </div>
        </div>
    );
}