import React, { useMemo, useState } from "react";
import { useLeaderboard } from "@/context/LeaderboardContext";
import { useAuth } from "@/context/AuthContext";
import { games } from "@shared/games";
import InteractiveCosmicBackground from "@/components/InteractiveCosmicBackground";

const Leaderboards: React.FC = () => {
  const { getTop } = useLeaderboard();
  const { user } = useAuth();
  const [gameId, setGameId] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [period, setPeriod] = useState<"all" | "day" | "week" | "month">("all");
  const [friendsOnly, setFriendsOnly] = useState(false);

  const entries = useMemo(
    () =>
      getTop({
        gameId: gameId || undefined,
        region: region || undefined,
        period,
        friendsOnly,
        user,
      }),
    [gameId, region, period, friendsOnly, user],
  );

  return (
    <div className="relative min-h-screen bg-black text-white p-6 max-w-5xl mx-auto">
      <InteractiveCosmicBackground />
      <div className="relative z-20">
        <h1 className="text-3xl font-bold mb-4">Leaderboards</h1>
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            aria-label="Select game"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="bg-black/50 border border-gray-700 rounded px-3 py-2"
          >
            <option value="">All Games</option>
            {games
              .filter((g) => g.isImplemented)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
          </select>
          <input
            aria-label="Region filter"
            placeholder="Region (e.g., US, EU)"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-black/50 border border-gray-700 rounded px-3 py-2"
          />
          <select
            aria-label="Time period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="bg-black/50 border border-gray-700 rounded px-3 py-2"
          >
            <option value="all">All Time</option>
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={friendsOnly}
              onChange={(e) => setFriendsOnly(e.target.checked)}
            />{" "}
            Friends only
          </label>
        </div>
        <div className="bg-white/5 border border-gray-700 rounded overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Player</th>
                <th className="px-4 py-2">Game</th>
                <th className="px-4 py-2">Region</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No scores yet.
                  </td>
                </tr>
              ) : (
                entries.map((e, i) => (
                  <tr
                    key={`${e.userId}-${e.gameId}-${e.timestamp}`}
                    className="odd:bg-white/5"
                  >
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2">{e.username}</td>
                    <td className="px-4 py-2">{e.gameId}</td>
                    <td className="px-4 py-2">{e.region || "-"}</td>
                    <td className="px-4 py-2 font-semibold">
                      {e.score.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboards;
