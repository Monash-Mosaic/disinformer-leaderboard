"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPlayers, getTotalCount, prefetchPageCursors, PaginatedResult } from "@/services/players";
import { Player, RankingCriteria } from "@/types/leaderboard";
import { QueryDocumentSnapshot } from "firebase/firestore";
import SearchBar from "./LeaderboardSearchBar";
import Pagination from "./LeaderboardPagination";
import LeaderboardSkeleton from "./LeaderboardSkeleton";
import ToggleButton from "./LeaderboardToggleButton";

/**
 * Props for LeaderboardTable component
 * These are passed from the Server Component and represent URL state
 */
interface LeaderboardTableProps {
    initialPage?: number;           // Starting page number from URL
    initialMode?: RankingCriteria;  // Initial ranking mode from URL
    initialSearch?: string;         // Initial search term from URL
}

/**
 * Cache structure for storing Firestore document snapshots
 * Enables efficient cursor-based pagination across page navigation
 * 
 * Key format: "mode-search-page" (e.g., "disinformer--1", "netizen-john-2")
 * - Separates different contexts (mode/search combinations)
 * - Allows instant retrieval of previously fetched pages
 * - Stored in useRef to persist across re-renders without causing re-renders
 */
interface PageCache {
    [key: string]: {
        data: PaginatedResult;                  // Complete paginated result from Firestore
        lastDoc: QueryDocumentSnapshot | null;  // Document snapshot cursor for next page
    };
}

/**
 * LeaderboardTable Client Component
 * 
 * This component handles the interactive leaderboard with:
 * - Cursor-based pagination for efficient data fetching
 * - Search filtering with debounced input
 * - Mode toggling (Disinformer <-> Netizen)
 * - URL state synchronization for shareable links
 * - Intelligent caching to avoid redundant Firestore queries
 * 
 * Architecture:
 * 1. Receives initial state from Server Component (from URL)
 * 2. Maintains client state for interactive features
 * 3. Synchronizes state changes back to URL
 * 4. Caches Firestore cursors for efficient pagination
 * 5. Uses transitions for non-blocking navigation
 */
export default function LeaderboardTable({
    initialPage = 1,
    initialMode = RankingCriteria.Disinformer,
    initialSearch = ''
}: LeaderboardTableProps) {
    // Next.js navigation hooks
    const router = useRouter();              // For programmatic navigation
    const searchParams = useSearchParams();   // For reading current URL params
    const [isPending, startTransition] = useTransition();  // For non-blocking updates

    // Data state
    const [players, setPlayers] = useState<Player[]>([]);  // Current page of players
    const [loading, setLoading] = useState(false);          // Loading indicator
    const [error, setError] = useState<string | null>(null); // Error message

    // Filter/navigation state
    const [mode, setMode] = useState<RankingCriteria>(initialMode);  // Current ranking mode
    const [currentPage, setCurrentPage] = useState(initialPage);     // Current page number
    const [inputValue, setInputValue] = useState(initialSearch);     // Controlled input value
    const [searchTerm, setSearchTerm] = useState(initialSearch);     // Actual search filter (on submit)

    // Pagination configuration
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1);  // Total available pages
    const [hasNextPage, setHasNextPage] = useState(false);  // Flag to track if more pages exist
    const totalCountCacheRef = useRef<{ [key: string]: number }>({});  // Cache total counts per mode/search
    const cursorMapRef = useRef<{ [key: string]: Map<number, QueryDocumentSnapshot | null> }>({});  // Pre-fetched cursors for all pages

    // Cache for Firestore document snapshots (cursors)
    // useRef prevents cache from being reset on re-renders and doesn't trigger re-renders on mutation
    const pageCacheRef = useRef<PageCache>({});

    /**
     * Updates URL with new state parameters
     * 
     * This function synchronizes component state to URL search parameters,
     * enabling:
     * - Shareable links with full state preservation
     * - Browser back/forward navigation
     * - Bookmarkable filtered/paginated views
     * 
     * Uses startTransition to make navigation non-blocking, preventing
     * UI from freezing during URL updates.
     * 
     * @param newPage - Page number to navigate to
     * @param newMode - Ranking mode to display
     * @param newSearch - Search term to filter by
     */
    const updateURL = (newPage: number, newMode: RankingCriteria, newSearch: string) => {
        // Create new URLSearchParams from current params
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
        // This keeps the UI responsive during URL updates
        startTransition(() => {
            router.push(`/leaderboard?${params.toString()}`, { scroll: false });
        });
    };

    /**
     * Effect: Fetch players data when page, mode, or search term changes
     * 
     * Implements a hybrid approach combining cursor-based pagination with pre-fetched cursors:
     * 
     * Strategy:
     * 1. On first load: Pre-fetch all page cursors in a single query
     * 2. Store cursor positions for each page boundary
     * 3. Enable direct jumps to any page (no sequential navigation needed)
     * 4. Cache fetched page data for instant re-visits
     * 
     * Cache Invalidation:
     * - When returning to page 1: Clear all caches for fresh data
     * - When changing mode/search: New cache keys are used automatically
     * 
     * Benefits of this approach:
     * - Solves Firestore's sequential pagination limitation
     * - Enables instant jumps to any page (e.g., page 1 directly to page 5)
     * - Only requires one initial query to fetch all cursors
     * - Efficient for datasets under 10,000 records
     * - Better UX with pagination UI showing all page numbers
     * 
     * Example flow:
     * Page 1 -> Pre-fetch all cursors, fetch page 1 data
     * Jump to Page 5 -> Use pre-fetched cursor, fetch page 5 data instantly
     * Back to Page 1 -> Instant (cached)
     */
    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            setError(null);

            try {
                // Create base cache key for current mode and search context
                const cacheKey = `${mode}-${searchTerm}`;

                // Clear all caches when returning to page 1 to ensure fresh data
                if (currentPage === 1) {
                    Object.keys(pageCacheRef.current).forEach(key => {
                        if (key.startsWith(cacheKey)) {
                            delete pageCacheRef.current[key];
                        }
                    });
                    delete totalCountCacheRef.current[cacheKey];
                    delete cursorMapRef.current[cacheKey];
                }

                // Fetch total count and pre-fetch all page cursors if not cached
                if (!totalCountCacheRef.current[cacheKey]) {
                    try {
                        const totalCount = await getTotalCount(mode, searchTerm);
                        totalCountCacheRef.current[cacheKey] = totalCount;

                        // Pre-fetch all page cursors for instant navigation to any page
                        const cursors = await prefetchPageCursors(
                            mode,
                            searchTerm,
                            totalCount,
                            itemsPerPage
                        );
                        cursorMapRef.current[cacheKey] = cursors;
                    } catch (countError) {
                        console.warn('Failed to fetch total count or cursors:', countError);
                        // Continue without pre-fetched cursors - will fall back to sequential pagination
                    }
                }

                // Construct unique key for this specific page
                const pageKey = `${cacheKey}-${currentPage}`;

                // Check cache first for instant navigation
                if (pageCacheRef.current[pageKey]) {
                    const cached = pageCacheRef.current[pageKey];
                    setPlayers(cached.data.players);
                    setHasNextPage(cached.data.hasMore);

                    // Calculate total pages from cached count if available
                    if (totalCountCacheRef.current[cacheKey]) {
                        const totalCount = totalCountCacheRef.current[cacheKey];
                        setTotalPages(Math.ceil(totalCount / itemsPerPage));
                    } else {
                        // Fallback to hasMore logic
                        setTotalPages(cached.data.hasMore ? currentPage + 1 : currentPage);
                    }
                } else {
                    // Cache miss: Need to fetch from Firestore

                    // Get the pre-fetched cursor for this page (enables direct page jumps)
                    const cursorMap = cursorMapRef.current[cacheKey];
                    const cursor = cursorMap?.get(currentPage) ?? null;

                    // Fetch data from Firestore using pre-fetched cursor
                    // This allows jumping directly to any page without sequential navigation
                    const result = await getPlayers(mode, itemsPerPage, cursor, searchTerm);

                    // Cache the result for future access
                    pageCacheRef.current[pageKey] = {
                        data: result,
                        lastDoc: result.lastDoc  // Store cursor for next page
                    };

                    // Update UI state
                    setPlayers(result.players);
                    setHasNextPage(result.hasMore);

                    // Calculate total pages from cached count if available
                    if (totalCountCacheRef.current[cacheKey]) {
                        const totalCount = totalCountCacheRef.current[cacheKey];
                        setTotalPages(Math.ceil(totalCount / itemsPerPage));
                    } else {
                        // Fallback to hasMore logic if count fetch failed
                        setTotalPages(result.hasMore ? currentPage + 1 : currentPage);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch players");
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, [mode, currentPage, searchTerm, itemsPerPage]);

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
     * 
     * Note: Search is applied on submit, not on every keystroke
     * (inputValue tracks typing, searchTerm triggers actual search)
     */
    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setCurrentPage(1);  // Reset to first page on new search
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
        ? 'Disinformer Leaderboard'
        : 'Netizen Leaderboard';

    return (
        <div className="py-4 sm:py-6 md:py-8">
            <div className="max-w-[1300px] mx-auto px-2 sm:px-4">
                <h1 
                    className={`lg:text-6xl md:text-5xl sm:text-4xl font-['Luckiest_Guy'] text-center mb-8 ${mode === RankingCriteria.Netizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                    style={{ letterSpacing: '0.72px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', lineHeight: '1.4' }}
                >
                    {mode === RankingCriteria.Netizen ? 'Netizen Leaderboards' : 'Disinformer Leaderboards'}
                </h1>

                <ToggleButton
                    onClick={handleModeToggle}
                    disabled={loading || isPending}
                    text=""
                    mode={mode === RankingCriteria.Disinformer ? 'disinformer' : 'netizen'}
                />

                <SearchBar
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    onSubmit={handleSearch}
                    disabled={loading || isPending}
                />

                {error ? (
                    <p className="text-red-500 text-center text-sm sm:text-base">{error}</p>
                ) : (
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

                        {/* No Results Message */}
                        {players.length === 0 ? (
                            <div className="text-center py-12 sm:py-16">
                                <p className={`font-['Play'] font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl ${mode === RankingCriteria.Netizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                                    style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                                >
                                    No results found
                                </p>
                            </div>
                        ) : (
                        <>
                        {/* Leaderboard Rows */}
                        <div className="space-y-2 sm:space-y-3">{players.map((player, index) => {
                                const globalRank = (currentPage - 1) * itemsPerPage + index + 1;
                                
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
                                        className={`${bgColor} rounded-xl sm:rounded-[20px] grid grid-cols-[30px_1fr_1fr_1.2fr_1fr] sm:grid-cols-[50px_1fr_1fr_1.3fr_1fr] md:grid-cols-[60px_1fr_1fr_1.5fr_1.2fr] lg:grid-cols-[80px_1fr_1fr_1.5fr_1.2fr] gap-1 sm:gap-2 lg:gap-4 items-center px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-5`}
                                    >
                                        {/* Place with medal badge for top 3 */}
                                        <div className="flex justify-center items-center">
                                            {globalRank <= 3 ? (
                                                <div className="relative">
                                                    {/* Medal wings */}
                                                    <div className="absolute top-[17px] sm:top-5 lg:top-[25px] left-0 w-3 sm:w-[15px] lg:w-[19px] h-[17px] sm:h-5 lg:h-[25px]">
                                                        <img 
                                                            src={"/assets/medal-wing-left.png"} 
                                                            alt="" 
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                    <div className="absolute top-[17px] sm:top-5 lg:top-[25px] right-0 w-3 sm:w-[15px] lg:w-[19px] h-[17px] sm:h-5 lg:h-[25px]">
                                                        <img 
                                                            src={"/assets/medal-wing-right.png"} 
                                                            alt="" 
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border border-black sm:border-2 flex items-center justify-center ${bgColor} relative z-10`}>
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
                                        <div className="text-center overflow-hidden">
                                            <span 
                                                className="font-['Play'] font-bold text-[8px] sm:text-xs md:text-base lg:text-[20px] text-[#2d4143] wrap-break-word line-clamp-2"
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
                                        <div className="text-center overflow-hidden">
                                            <span 
                                                className="font-['Play'] font-bold text-[8px] sm:text-xs md:text-base lg:text-[20px] text-[#2d4143] wrap-break-word line-clamp-2"
                                                style={{ letterSpacing: '0.2px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
                                            >
                                                {player.society || "N/A"}
                                            </span>
                                        </div>
                                        
                                        {/* Branch */}
                                        <div className="text-center overflow-hidden">
                                            <span 
                                                className="font-['Play'] font-bold text-[8px] sm:text-xs md:text-base lg:text-[20px] text-[#2d4143] wrap-break-word line-clamp-2"
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
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPrev={() => handlePageChange(currentPage - 1)}
                            onNext={() => hasNextPage ? handlePageChange(currentPage + 1) : undefined}
                            onPageClick={handlePageChange}
                        />
                        </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}