"use client";

import { use, useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RankingCriteria } from "@/types/leaderboard";
import { LeaderboardPageResult } from "@/types/pagination";
import { fetchLeaderboardAction } from "@/app/leaderboard-offsetbased/actions";
import { subscribeToLeaderboardChanges } from "@/services/leaderboard-offset-realtime-service";
import LeaderboardSearchBar from "./LeaderboardSearchBar";
import LeaderboardToggleButton from "./LeaderboardToggleButton";
import LeaderboardPagination from "./LeaderboardPagination";

/**
 * Props for LeaderboardTableOffsetBased component
 * These are passed from the Server Component and represent URL state
 */
interface LeaderboardTableOffsetBasedProps {
    dataPromise: Promise<LeaderboardPageResult>;  // Server-fetched data promise
    initialPage: number;           // Starting page number from URL
    initialMode: RankingCriteria;  // Initial ranking mode from URL
    initialSearch: string;         // Initial search term from URL
    enableRealtime?: boolean;      // Enable real-time updates (default: true)
}

/**
 * LeaderboardTableOffsetBased Client Component
 *
 * This component implements offset-based pagination with real-time updates using the hybrid approach.
 * Combines server-side initial data fetching with client-side real-time subscriptions.
 *
 * Architecture:
 * - Server fetches initial data as a promise (server-side rendering benefits)
 * - Client component uses React's "use" hook to resolve the promise
 * - Real-time updates via Firebase client SDK listener
 * - When leaderboard changes, re-fetches current page using server action
 * - URL state synchronized for shareable links
 *
 * Key Features:
 * - Offset-based pagination (simpler implementation)
 * - Real-time updates without full client-side processing
 * - Search filtering with dynamic pagination updates
 * - URL state synchronization for shareable links
 * - Hybrid approach: server actions + client real-time
 *
 * Trade-offs vs Cursor-based:
 * + Simpler to understand and maintain
 * + No cursor caching complexity
 * - Less efficient for large page numbers
 * - Fetches more documents as page number increases
 * + Real-time updates with server-side consistency
 */
export default function LeaderboardTableOffsetBased({
    dataPromise,
    initialPage,
    initialMode,
    initialSearch,
    enableRealtime = true,
}: LeaderboardTableOffsetBasedProps) {
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


    /**
     * Handles real-time leaderboard updates
     * When the leaderboard changes, re-fetch the current page data silently
     */
    const handleLeaderboardChange = () => {
        if (enableRealtime) {
            fetchLeaderboardData(currentPage, mode, searchTerm, true); // Silent update
        }
    };

    /**
     * Handles real-time subscription errors
     */
    const handleRealtimeError = (error: Error) => {
        console.error('Real-time subscription error:', error);
        // Could show a toast notification here, but for now just log
        // Optionally disable real-time if there are persistent errors
    };

    // Set up real-time subscription
    useEffect(() => {
        if (!enableRealtime) return;

        const unsubscribe = subscribeToLeaderboardChanges(
            mode,
            searchTerm,
            handleLeaderboardChange,
            handleRealtimeError
        );

        return () => {
            unsubscribe();
        };
    }, [mode, searchTerm, enableRealtime]);

    /**
     * Fetches leaderboard data on the client side using Server Action
     * Used for subsequent navigations after initial server fetch
     */
    const fetchLeaderboardData = async (page: number, rankMode: RankingCriteria, search: string, silent = false) => {
        if (!silent) {
            setIsLoading(true);
        }
        setError(null);

        try {
            const result = await fetchLeaderboardAction(page, rankMode, search);
            setData(result);

            // Sync component state with server response (important for real-time updates)
            // If the server adjusted the page (e.g., due to total pages change), update local state
            if (result.currentPage !== currentPage) {
                setCurrentPage(result.currentPage);
                // Update URL to reflect the corrected page
                updateURL(result.currentPage, rankMode, search);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
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
            router.push(`/leaderboard-offsetbased?${params.toString()}`, { scroll: false });
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
    const isNetizen = mode === RankingCriteria.Netizen;

    return (
        <div className="py-4 sm:py-6 md:py-8">
            <div className="max-w-[1300px] mx-auto px-2 sm:px-4">
                <h1 
                    className={`lg:text-6xl md:text-5xl sm:text-4xl font-['Luckiest_Guy'] text-center mb-6 sm:mb-8 ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                    style={{ letterSpacing: '0.72px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', lineHeight: '1.4' }}
                >
                    {isNetizen ? 'Netizen Leaderboards' : 'Disinformer Leaderboards'}
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
                                className={`font-['Play'] font-bold text-[10px] sm:text-sm md:text-lg lg:text-[28px] text-center ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                            >
                                Place
                            </div>
                            <div 
                                className={`font-['Play'] font-bold text-[10px] sm:text-sm md:text-lg lg:text-[28px] text-center ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                            >
                                Username
                            </div>
                            <div 
                                className={`font-['Play'] font-bold text-[10px] sm:text-sm md:text-lg lg:text-[28px] text-center ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                            >
                                Points
                            </div>
                            <div 
                                className={`font-['Play'] font-bold text-[10px] sm:text-sm md:text-lg lg:text-[28px] text-center ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                            >
                                IFRC Societies
                            </div>
                            <div 
                                className={`font-['Play'] font-bold text-[10px] sm:text-sm md:text-lg lg:text-[28px] text-center ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                            >
                                Branches
                            </div>
                        </div>

                        {/* No Results Message */}
                        {data.players.length === 0 ? (
                            <div className="text-center py-12 sm:py-16">
                                <p className={`font-['Play'] font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                    style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                                >
                                    No results found
                                </p>
                            </div>
                        ) : (
                        <>
                        {/* Leaderboard Rows */}
                        <div className="space-y-2 sm:space-y-3">
                            {data.players.map((player, index) => {
                                const globalRank = (data.currentPage - 1) * 10 + index + 1;
                                
                                // Determine row background color based on rank
                                let bgColor = isNetizen ? 'bg-[#ff4805]/50' : 'bg-[#4ecaca]/50'; // Default based on mode
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
                                                    <div className="absolute top-3 sm:top-5 lg:top-[25px] left-0 w-3 sm:w-[15px] lg:w-[19px] h-[15px] sm:h-5 lg:h-[25px]">
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
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
}
