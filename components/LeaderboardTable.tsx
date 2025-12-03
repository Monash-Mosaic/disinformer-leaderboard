"use client";

import { useEffect, useState } from "react";
import { getPlayers } from "@/services/players";
import { Player } from "@/types/player";

export default function LeaderboardTable() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Default to disinformer mode
    const [mode, setMode] = useState<'disinformer' | 'netizen'>('disinformer');
    // Define pagination state, default to page 1
    const [currentPage, setCurrentPage] = useState(1);
    // Limit items per page
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true); // Reset loading on mode change
            try {
                const data = await getPlayers(mode);
                setPlayers(data);
                setCurrentPage(1); // Reset to first page on mode change
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch players");
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, [mode]); // Re-fetch when mode changes

    if (loading) return <p>Loading leaderboard...</p>;
    if (error) return <p>Error: {error}</p>;

    const toggleMode = () => setMode(mode === 'disinformer' ? 'netizen' : 'disinformer');
    const buttonText = mode === 'disinformer' ? 'Switch to Netizen Mode' : 'Switch to Disinformer Mode';
    const title = mode === 'disinformer' ? 'Disinformer Leaderboard' : 'Netizen Leaderboard';

    const totalPages = Math.ceil(players.length / itemsPerPage);
    const paginatedPlayers = players.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const handlePageClick = (page: number) => setCurrentPage(page);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <h1 className="text-4xl font-bold text-center mb-8 text-zinc-900 dark:text-white">
                    {title}
                </h1>

                {/* Search Bar */}
                <div className="mb-8 flex justify-center">
                    <input
                        type="text"
                        placeholder="Find user"
                        className="w-full max-w-md px-4 py-2 rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Toggle Button */}
                <div className="mb-4 flex justify-center">
                    <button
                        onClick={toggleMode}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        {buttonText}
                    </button>
                </div>

                {/* Leaderboard Table */}
                <div className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-lg shadow">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                                <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">Place</th>
                                <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">Username</th>
                                <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">Points</th>
                                <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">IFRO Societies</th>
                                <th className="px-6 py-4 text-left text-zinc-700 dark:text-zinc-300 font-semibold">Branches</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPlayers.map((player, index) => (
                                <tr
                                    key={player.username}
                                    className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block bg-cyan-400 text-zinc-900 px-4 py-2 rounded-lg font-medium">
                                            {player.username}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">
                                        {mode === 'disinformer' ? player.disinformerPoints : player.netizenPoints}
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
                <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                            key={num}
                            onClick={() => handlePageClick(num)}
                            className={`px-3 py-2 rounded ${num === currentPage
                                ? "bg-blue-500 text-white font-bold"
                                : "hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    );
}