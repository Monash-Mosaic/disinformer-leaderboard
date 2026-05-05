"use client";

import { useEffect, useState } from "react";
import { RankingCriteria, Player } from "@/types/leaderboard";
import { subscribeToTop100Leaderboard } from "@/services/leaderboard-realtime-top100";

const PAGE_SIZE = 10;

export default function LeaderboardRealtime() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState(RankingCriteria.Disinformer);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToTop100Leaderboard(
      mode,
      (data) => {
        setPlayers(data);
        setLoading(false);
      },
      (err) => {
        console.error("Realtime error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mode]);

  // CLIENT SIDE PAGINATION
  const start = (page - 1) * PAGE_SIZE;
  const paginatedPlayers = players.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(players.length / PAGE_SIZE);

  if (loading) return <div>Loading leaderboard...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Leaderboard</h1>

      {/* MODE SWITCH */}
      <div className="mb-4 flex gap-2">
        <button
          className="px-3 py-1 border"
          onClick={() => setMode(RankingCriteria.Disinformer)}
        >
          Disinformer
        </button>

        <button
          className="px-3 py-1 border"
          onClick={() => setMode(RankingCriteria.Netizen)}
        >
          Netizen
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full border">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Points</th>
            <th>Games</th>
          </tr>
        </thead>

        <tbody>
          {paginatedPlayers.map((p, index) => (
            <tr key={p.id}>
              <td>{start + index + 1}</td>
              <td>{p.username}</td>
              <td>
                {mode === RankingCriteria.Netizen
                  ? p.totalNetizenPoints
                  : p.totalDisinformerPoints}
              </td>
              <td>{p.totalGamesPlayed}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>

        <span>
          Page {page} / {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}