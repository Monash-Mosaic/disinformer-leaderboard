interface LeaderboardEntry {
    place: number;
    username: string;
    points: number;
    society?: string;
    branch?: string;
}

const leaderboardData: LeaderboardEntry[] = [
    { place: 1, username: "Joe", points: 500, society: "Australia" },
    { place: 2, username: "Joe", points: 358, society: "Americas" },
    { place: 3, username: "Joe", points: 200, society: "Europe" },
    { place: 4, username: "Joe", points: 198 },
    { place: 5, username: "Joe", points: 180 },
    { place: 6, username: "Joe", points: 150 },
    { place: 7, username: "Joe", points: 120 },
    { place: 8, username: "Joe", points: 100 },
    { place: 9, username: "Joe", points: 80 },
    { place: 10, username: "Joe", points: 60 },
];

export default function Leaderboard() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <h1 className="text-4xl font-bold text-center mb-8 text-zinc-900 dark:text-white">
                    Disinformer Leaderboard
                </h1>

                {/* Search Bar */}
                <div className="mb-8 flex justify-center">
                    <input
                        type="text"
                        placeholder="Find user"
                        className="w-full max-w-md px-4 py-2 rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
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
                            {leaderboardData.map((entry) => (
                                <tr
                                    key={entry.place}
                                    className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-lg font-bold text-zinc-900 dark:text-white">
                                            {entry.place}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block bg-cyan-400 text-zinc-900 px-4 py-2 rounded-lg font-medium">
                                            {entry.username}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-900 dark:text-white font-semibold">
                                        {entry.points}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                                        {entry.society || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                                        {entry.branch || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="mt-8 flex justify-center items-center gap-2">
                    <button className="px-3 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        ◀
                    </button>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => (
                        <button
                            key={num}
                            className={`px-3 py-2 rounded ${num === 1
                                ? "bg-blue-500 text-white font-bold"
                                : "hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                    <button className="px-3 py-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        ▶
                    </button>
                </div>
            </div>
        </div>
    );
}