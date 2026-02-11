import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import InteractiveCosmicBackground from "@/components/InteractiveCosmicBackground";
import { motion } from "framer-motion";
import { Shield, Mail, Globe, Trophy, Star, Gamepad2, Users, CheckCircle, AlertTriangle } from "lucide-react";

const Profile: React.FC = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-6">
        <InteractiveCosmicBackground />
        <div className="relative z-20 text-center">
          <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Profile</h1>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 transition-all duration-300"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Info */}
          <motion.div
            className="bg-white/5 border border-gray-700/50 rounded-xl p-5 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 text-lg font-semibold mb-3">
              <Shield size={18} className="text-cyan-400" />
              Account
            </div>
            {user.avatarUrl && (
              <div className="mb-3">
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full border-2 border-cyan-500/40"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="space-y-2 text-sm text-gray-200">
              <div className="flex items-center gap-2">
                <Gamepad2 size={14} className="text-purple-400" />
                <span>Username: <span className="text-white font-medium">{user.username}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-cyan-400" />
                <span>Email: <span className="text-white font-medium">{user.email}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-green-400" />
                <span>Region: <span className="text-white font-medium">{user.region}</span></span>
              </div>
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div
            className="bg-white/5 border border-gray-700/50 rounded-xl p-5 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 text-lg font-semibold mb-3">
              <Trophy size={18} className="text-yellow-400" />
              Achievements
            </div>
            <ul className="text-sm text-gray-200 space-y-1">
              {user.achievements.length === 0 ? (
                <li className="text-gray-500 italic">No achievements yet. Start playing!</li>
              ) : (
                user.achievements.map((a) => <li key={a.id}>{a.name}</li>)
              )}
            </ul>
          </motion.div>

          {/* Badges */}
          <motion.div
            className="bg-white/5 border border-gray-700/50 rounded-xl p-5 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 text-lg font-semibold mb-3">
              <Star size={18} className="text-pink-400" />
              Badges
            </div>
            <div className="flex flex-wrap gap-2">
              {user.badges.length === 0 ? (
                <span className="text-gray-500 italic text-sm">No badges yet.</span>
              ) : (
                user.badges.map((b) => (
                  <span
                    key={b.id}
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: b.color }}
                  >
                    {b.name}
                  </span>
                ))
              )}
            </div>
          </motion.div>

          {/* Game Statistics */}
          <motion.div
            className="bg-white/5 border border-gray-700/50 rounded-xl p-5 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 text-lg font-semibold mb-3">
              <Gamepad2 size={18} className="text-cyan-400" />
              Game Statistics
            </div>
            <ul className="text-sm text-gray-200 space-y-1">
              {Object.keys(user.stats).length === 0 ? (
                <li className="text-gray-500 italic">No stats yet.</li>
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
          </motion.div>
        </div>

        <div className="mt-6 text-sm text-gray-400 text-center">
          <p>🎮 Play any game while logged in to record leaderboard scores automatically.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
