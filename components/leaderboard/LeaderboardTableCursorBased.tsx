"use client";

import { use, useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPaginatedLeaderboard, subscribeToLeaderboardWithPagination } from "@/services/leaderboard-service";
import { RankingCriteria } from "@/types/leaderboard";
import { LeaderboardPageResult } from "@/types/pagination";
import LeaderboardSearchBar from "./LeaderboardSearchBar";
import LeaderboardPagination from "./LeaderboardPagination";
import LeaderboardToggleButton from "./LeaderboardToggleButton";

/**
 * Props for LeaderboardTableCursorBased component
 * These are passed from the Server Component and represent URL state
 */
interface LeaderboardTableCursorBasedProps {
    dataPromise: Promise<LeaderboardPageResult>;  // Server-fetched data promise
    initialPage: number;           // Starting page number from URL
    initialMode: RankingCriteria;  // Initial ranking mode from URL
    initialSearch: string;         // Initial search term from URL
    enableRealtime?: boolean;      // Enable real-time updates (default: true)
}

/**
 * LeaderboardTableCursorBased Client Component
 *
 * This component implements cursor-based pagination using the leaderboard-service.ts.
 * Features efficient random access pagination with cursor caching.
 *
 * Architecture:
 * - Server fetches initial data as a promise
 * - Client component uses React's "use" hook to resolve the promise
 * - Handles subsequent page changes, mode switches, and searches with client-side re-fetching
 * - URL state synchronized for shareable links
 *
 * Key Features:
 * - Cursor-based pagination for Firestore efficiency
 * - Random access to any page (no sequential navigation required)
 * - Search filtering with dynamic pagination updates
 * - URL state synchronization for shareable links
 * - Cursor caching for instant navigation between pages
 */
export default function LeaderboardTableCursorBased({
    dataPromise,
    initialPage,
    initialMode,
    initialSearch,
    enableRealtime = true,
}: LeaderboardTableCursorBasedProps) {
    // Use the "use" hook to resolve the server-fetched data promise
    const initialData = use(dataPromise);

    // Next.js navigation hooks
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Component state
    const [data, setData] = useState<LeaderboardPageResult>(initialData);
    const [error, setError] = useState<string | null>(null);

    // Filter/navigation state
    const [mode, setMode] = useState<RankingCriteria>(initialMode);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [inputValue, setInputValue] = useState(initialSearch);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [isLoading, setIsLoading] = useState(false);

    // Real-time subscription state
    const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
    const [isRealtime, setIsRealtime] = useState(false);

    // Set up real-time listener on mount and when dependencies change
    useEffect(() => {
        if (!enableRealtime) return;

        console.log('[Realtime] Setting up listener for page', currentPage, 'mode', mode);

        // Subscribe to real-time updates
        const unsub = subscribeToLeaderboardWithPagination(
            currentPage,
            mode,
            (result) => {
                console.log('[Realtime] Data updated:', result);
                setData(result);
            },
            (err) => {
                console.error('[Realtime] Error:', err);
                setError(err.message);
            },
            searchTerm || undefined
        );

        setUnsubscribe(() => unsub);
        setIsRealtime(true);

        return () => {
            console.log('[Realtime] Unsubscribing listener');
            unsub();
            setIsRealtime(false);
        };
    }, [currentPage, mode, searchTerm, enableRealtime]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [unsubscribe]);

    /**
     * Fetches leaderboard data on the client side
     * Used for subsequent navigations after initial server fetch
     */
    const fetchLeaderboardData = async (page: number, rankMode: RankingCriteria, search: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await getPaginatedLeaderboard(page, rankMode, search);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
        } finally {
            setIsLoading(false);
        }
    };

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
        setCurrentPage(1);

        updateURL(1, newMode, searchTerm);
        fetchLeaderboardData(1, newMode, searchTerm);
    };

    /**
     * Handles search submission
     * - Applies new search filter
     * - Resets to page 1 (new filtered data set)
     * - Updates URL with search parameter
     */
    const handleSearchSubmit = (term: string) => {
        setSearchTerm(term);
        setCurrentPage(1);
        setInputValue(term);

        updateURL(1, mode, term);
        fetchLeaderboardData(1, mode, term);
    };

    /**
     * Handles page navigation
     * - Updates current page
     * - Preserves mode and search state
     * - Triggers data fetch
     */
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateURL(page, mode, searchTerm);
        fetchLeaderboardData(page, mode, searchTerm);
    };

    // Dynamic UI text based on current mode
    const buttonText = mode === RankingCriteria.Disinformer
        ? 'Switch to Netizen Mode'
        : 'Switch to Disinformer Mode';
    const title = mode === RankingCriteria.Disinformer
        ? 'Disinformer Leaderboard (Cursor-Based)'
        : 'Netizen Leaderboard (Cursor-Based)';

    const loading = isLoading || isPending;

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
                    disabled={loading}
                />

                <LeaderboardToggleButton
                    onClick={handleModeToggle}
                    disabled={loading}
                    text={buttonText}
                />

                {error ? (
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
                                            IFRC Society
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