"use client";

import LeaderboardSearchBar from "./LeaderboardSearchBar";
import LeaderboardToggleButton from "./LeaderboardToggleButton";

export default function LeaderboardSkeleton() {
    const itemsPerPage = 10;
    const title = 'Disinformer Leaderboard';
    return (
        <>
            {/* Title */}
            <h1 className="text-4xl font-bold text-center mb-8 text-zinc-900 dark:text-white">
                {title}
            </h1>

            {/* Search Bar Skeleton */}
            <LeaderboardSearchBar
                inputValue={''}
                setInputValue={() => { }}
                onSubmit={() => { }}
                disabled={true}
            />

            {/* Toggle Button Skeleton */}
            <LeaderboardToggleButton
                onClick={() => { }}
                disabled={true}
                text={'Switch to Netizen Mode'}
            />
            {/* Table Skeleton */}
            <div className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-lg shadow">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                            <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">Place</th>
                            <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">Username</th>
                            <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">Points</th>
                            <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">Games</th>
                            <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">IFRC Society</th>
                            <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">Branch</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: itemsPerPage }, (_, index) => (
                            <tr key={index} className="border-b border-zinc-200 dark:border-zinc-800">
                                <td className="px-6 py-4">
                                    <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Skeleton */}
            <div className="mt-8 flex justify-center items-center gap-2">
                <div className="w-10 h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="w-10 h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                ))}
                <div className="w-10 h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
            </div>
        </>
    );
}