"use client";

import LeaderboardSearchBar from "./LeaderboardSearchBar";
import LeaderboardToggleButton from "./LeaderboardToggleButton";

export default function LeaderboardSkeleton() {
    const itemsPerPage = 10;
    const isNetizen = false; // Default to disinformer theme for skeleton
    
    return (
        <div className="py-8">
            <div className="max-w-[1300px] mx-auto">
                {/* Title */}
                <h1 
                    className={`text-[72px] font-['Luckiest_Guy'] text-center mb-8 ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                    style={{ letterSpacing: '0.72px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', lineHeight: '1.4' }}
                >
                    Disinformer Leaderboards
                </h1>

                {/* Toggle Button Skeleton */}
                <LeaderboardToggleButton
                    onClick={() => { }}
                    disabled={true}
                    text=""
                    mode="disinformer"
                />

                {/* Search Bar Skeleton */}
                <LeaderboardSearchBar
                    inputValue={''}
                    setInputValue={() => { }}
                    onSubmit={() => { }}
                    disabled={true}
                />

                {/* Table Headers Skeleton */}
                <div className="grid grid-cols-[80px_1fr_1fr_1.5fr_1.2fr] gap-4 mb-4 px-4">
                    <div 
                        className={`font-['Play'] font-bold text-[28px] text-center ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                        style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                    >
                        Place
                    </div>
                    <div 
                        className={`font-['Play'] font-bold text-[28px] text-center ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                        style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                    >
                        Username
                    </div>
                    <div 
                        className={`font-['Play'] font-bold text-[28px] text-center ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                        style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                    >
                        Points
                    </div>
                    <div 
                        className={`font-['Play'] font-bold text-[28px] text-center ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                        style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                    >
                        IFRC Societies
                    </div>
                    <div 
                        className={`font-['Play'] font-bold text-[28px] text-center ${isNetizen ? 'text-[#ff4805]' : 'text-[#317070]'}`}
                        style={{ letterSpacing: '0.28px', textShadow: '0px 4px 4px rgba(0,0,0,0.25)', textDecoration: 'underline' }}
                    >
                        Branches
                    </div>
                </div>

                {/* Leaderboard Rows Skeleton */}
                <div className="space-y-3">
                    {Array.from({ length: itemsPerPage }, (_, index) => {
                        const globalRank = index + 1;
                        
                        // Determine row background color based on rank
                        let bgColor = isNetizen ? 'bg-[#ff4805]/50' : 'bg-[#4ecaca]/50'; // Default based on mode
                        if (globalRank === 1) bgColor = 'bg-[#ffd700]'; // Gold
                        else if (globalRank === 2) bgColor = 'bg-[#c4c4c4]'; // Silver
                        else if (globalRank === 3) bgColor = 'bg-[#e5a01d]'; // Bronze
                        
                        return (
                            <div 
                                key={index}
                                className={`${bgColor} rounded-[20px] grid grid-cols-[80px_1fr_1fr_1.5fr_1.2fr] gap-4 items-center px-4 py-5`}
                            >
                                {/* Place */}
                                <div className="flex justify-center items-center">
                                    <div className="w-8 h-8 bg-zinc-300 dark:bg-zinc-600 rounded animate-pulse"></div>
                                </div>
                                
                                {/* Username */}
                                <div className="text-center">
                                    <div className="w-24 h-8 bg-zinc-300 dark:bg-zinc-600 rounded animate-pulse mx-auto"></div>
                                </div>
                                
                                {/* Points */}
                                <div className="text-center">
                                    <div className="w-16 h-8 bg-zinc-300 dark:bg-zinc-600 rounded animate-pulse mx-auto"></div>
                                </div>
                                
                                {/* IFRC Society */}
                                <div className="text-center">
                                    <div className="w-20 h-8 bg-zinc-300 dark:bg-zinc-600 rounded animate-pulse mx-auto"></div>
                                </div>
                                
                                {/* Branch */}
                                <div className="text-center">
                                    <div className="w-18 h-8 bg-zinc-300 dark:bg-zinc-600 rounded animate-pulse mx-auto"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Skeleton */}
                <div className="mt-8 flex justify-center items-center gap-2">
                    <div className="w-10 h-8 bg-zinc-300 dark:bg-zinc-600 rounded animate-pulse"></div>
                    {Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className="w-10 h-8 bg-zinc-300 dark:bg-zinc-600 rounded animate-pulse"></div>
                    ))}
                    <div className="w-10 h-8 bg-zinc-300 dark:bg-zinc-600 rounded animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}