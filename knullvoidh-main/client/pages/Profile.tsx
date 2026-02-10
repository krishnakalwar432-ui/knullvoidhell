import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import InteractiveCosmicBackground from "@/components/InteractiveCosmicBackground";

const Profile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  if (!user)
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-6">
        <InteractiveCosmicBackground />
        <div className="relative z-20 text-center">
          <p className="mb-4">You are not logged in.</p>
          <Link className="px-4 py-2 rounded bg-cyan-600" to="/login">
            Login
          </Link>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen bg-black text-white p-6 max-w-3xl mx-auto">
      <InteractiveCosmicBackground />
      <div className="relative z-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button
            onClick={logout}
            className="px-3 py-2 rounded bg-red-600/40 border border-red-500/40"
          >
            Logout
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-gray-700 rounded p-4">
            <div className="text-lg font-semibold">Account</div>
            <div className="mt-2 text-sm text-gray-200">
              Username: {user.username}
            </div>
            <div className="text-sm text-gray-200">Email: {user.email}</div>
            <div className="text-sm text-gray-200">Region: {user.region}</div>
          </div>
          <div className="bg-white/5 border border-gray-700 rounded p-4">
            <div className="text-lg font-semibold">Achievements</div>
            <ul className="mt-2 text-sm text-gray-200 space-y-1">
              {user.achievements.length === 0 ? (
                <li>No achievements yet.</li>
              ) : (
                user.achievements.map((a) => <li key={a.id}>{a.name}</li>)
              )}
            </ul>
          </div>
          <div className="bg-white/5 border border-gray-700 rounded p-4">
            <div className="text-lg font-semibold">Badges</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.badges.length === 0 ? (
                <span>No badges yet.</span>
              ) : (
                user.badges.map((b) => (
                  <span
                    key={b.id}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ backgroundColor: b.color }}
                  >
                    {b.name}
                  </span>
                ))
              )}
            </div>
          </div>
          <div className="bg-white/5 border border-gray-700 rounded p-4">
            <div className="text-lg font-semibold">Game Statistics</div>
            <ul className="mt-2 text-sm text-gray-200 space-y-1">
              {Object.keys(user.stats).length === 0 ? (
                <li>No stats yet.</li>
              ) : (
                Object.entries(user.stats).map(([gid, s]) => (
                  <li key={gid} className="flex justify-between">
                    <span>{gid}</span>
                    <span>
                      High: {s.highScore} • Plays: {s.plays}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
        <div className="mt-6 text-sm text-gray-400">
          Tip: Play any game while logged in to record leaderboard scores
          automatically.
        </div>
      </div>
    </div>
  );
};

export default Profile;
