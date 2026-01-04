"use client";

import { use, useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPaginatedLeaderboard, subscribeToLeaderboardWithPagination } from "@/services/leaderboard-cursor-service";
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

        return () => {
            console.log('[Realtime] Unsubscribing listener');
            unsub();
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

    const loading = isLoading || isPending;

    return (
        <div className="py-4 sm:py-6 md:py-8">
            <div className="max-w-[1300px] mx-auto px-2 sm:px-4">
                <h1 
                    className={`lg:text-6xl md:text-5xl sm:text-4xl font-['Luckiest_Guy'] text-center mb-6 sm:mb-8 ${mode === RankingCriteria.Netizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                    style={{ letterSpacing: '0.72px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', lineHeight: '1.4' }}
                >
                    {mode === RankingCriteria.Netizen ? 'Netizen Leaderboards' : 'Disinformer Leaderboards'}
                </h1>

                <LeaderboardToggleButton
                    onClick={handleModeToggle}
                    disabled={loading}
                    text=""
                    mode={mode === RankingCriteria.Disinformer ? 'disinformer' : 'netizen'}
                />

                <LeaderboardSearchBar
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    onSubmit={handleSearchSubmit}
                    disabled={loading}
                />

                {error ? (
                    <p className="text-red-500 text-center text-sm sm:text-base">{error}</p>
                ) : data ? (
                    <>
                        {/* Table Headers */}
                        <div className="grid grid-cols-[30px_1fr_1fr_1.2fr_1fr] sm:grid-cols-[50px_1fr_1fr_1.3fr_1fr] md:grid-cols-[60px_1fr_1fr_1.5fr_1.2fr] lg:grid-cols-[80px_1fr_1fr_1.5fr_1.2fr] gap-1 sm:gap-2 lg:gap-4 mb-3 sm:mb-4 px-2 sm:px-3 lg:px-4">
                            <div 
                                className={`font-['Play'] font-bold text-[10px] sm:text-sm md:text-lg lg:text-[28px] text-center ${mode === RankingCriteria.Netizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                            >
                                Place
                            </div>
                            <div 
                                className={`font-['Play'] font-bold text-[10px] sm:text-sm md:text-lg lg:text-[28px] text-center ${mode === RankingCriteria.Netizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                            >
                                Username
                            </div>
                            <div 
                                className={`font-['Play'] font-bold text-[10px] sm:text-sm md:text-lg lg:text-[28px] text-center ${mode === RankingCriteria.Netizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                            >
                                Points
                            </div>
                            <div 
                                className={`font-['Play'] font-bold text-[10px] sm:text-sm md:text-lg lg:text-[28px] text-center ${mode === RankingCriteria.Netizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                            >
                                IFRC Societies
                            </div>
                            <div 
                                className={`font-['Play'] font-bold text-[10px] sm:text-sm md:text-lg lg:text-[28px] text-center ${mode === RankingCriteria.Netizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                            >
                                Branches
                            </div>
                        </div>

                        {/* Leaderboard Rows */}
                        <div className="space-y-2 sm:space-y-3">
                            {data.players.map((player, index) => {
                                const globalRank = (data.currentPage - 1) * 10 + index + 1;
                                
                                // Determine row background color based on rank
                                let bgColor = mode === RankingCriteria.Netizen ? 'bg-[#ff4805]/50' : 'bg-[#4ecaca]/50'; // Default based on mode
                                if (globalRank === 1) bgColor = 'bg-[#ffd700]'; // Gold
                                else if (globalRank === 2) bgColor = 'bg-[#c4c4c4]'; // Silver
                                else if (globalRank === 3) bgColor = 'bg-[#e5a01d]'; // Bronze
                                
                                const points = mode === RankingCriteria.Disinformer
                                    ? player.totalDisinformerPoints
                                    : player.totalNetizenPoints;
                                
                                return (
                                    <div 
                                        key={player.id}
                                        className={`${bgColor} rounded-xl sm:rounded-[20px] grid grid-cols-[30px_1fr_1fr_1.2fr_1fr] sm:grid-cols-[50px_1fr_1fr_1.3fr_1fr] md:grid-cols-[60px_1fr_1fr_1.5fr_1.2fr] lg:grid-cols-[80px_1fr_1fr_1.5fr_1.2fr] gap-1 sm:gap-2 lg:gap-4 items-center px-2 sm:px-3 lg:px-4 py-3 sm:py-4 md:py-5`}
                                    >
                                        {/* Place with medal badge for top 3 */}
                                        <div className="flex justify-center items-center">
                                            {globalRank <= 3 ? (
                                                <div className="relative">
                                                    {/* Medal wings */}
                                                    <div className="absolute top-3 sm:top-5 lg:top-[25px] left-0 w-12 sm:w-[15px] lg:w-[19px] h-[15px] sm:h-5 lg:h-[25px]">
                                                        <img 
                                                            src={"/assets/medal-wing-left.png"} 
                                                            alt="" 
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                    <div className="absolute top-3 sm:top-5 lg:top-[25px] right-0 w-3 sm:w-[15px] lg:w-[19px] h-[15px] sm:h-5 lg:h-[25px]">
                                                        <img 
                                                            src={"/assets/medal-wing-right.png"} 
                                                            alt="" 
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border sm:border-2 border-black flex items-center justify-center ${bgColor} relative z-10`}>
                                                        <span 
                                                            className="font-['Play'] font-bold text-[8px] sm:text-xs md:text-base lg:text-[20px] text-[#2d4143]"
                                                            style={{ letterSpacing: '0.2px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                                                        >
                                                            {globalRank}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span 
                                                    className="font-['Play'] font-bold text-[8px] sm:text-xs md:text-base lg:text-[20px] text-[#2d4143]"
                                                    style={{ letterSpacing: '0.2px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                                                >
                                                    {globalRank}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Username */}
                                        <div className="text-center">
                                            <span 
                                                className="font-['Play'] font-bold text-[8px] sm:text-xs md:text-base lg:text-[20px] text-[#2d4143] wrap-break-word"
                                                style={{ letterSpacing: '0.2px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                                            >
                                                {player.username}
                                            </span>
                                        </div>
                                        
                                        {/* Points */}
                                        <div className="text-center">
                                            <span 
                                                className="font-['Play'] font-bold text-[8px] sm:text-xs md:text-base lg:text-[20px] text-[#2d4143]"
                                                style={{ letterSpacing: '0.2px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                                            >
                                                {points}
                                            </span>
                                        </div>
                                        
                                        {/* IFRC Society */}
                                        <div className="text-center">
                                            <span 
                                                className="font-['Play'] font-bold text-[8px] sm:text-xs md:text-base lg:text-[20px] text-[#2d4143] wrap-break-word"
                                                style={{ letterSpacing: '0.2px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                                            >
                                                {player.society || "N/A"}
                                            </span>
                                        </div>
                                        
                                        {/* Branch */}
                                        <div className="text-center">
                                            <span 
                                                className="font-['Play'] font-bold text-[8px] sm:text-xs md:text-base lg:text-[20px] text-[#2d4143] wrap-break-word"
                                                style={{ letterSpacing: '0.2px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                                            >
                                                {player.branch || "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
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