import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User } from './AuthContext';

type Entry = { userId: string; username: string; region?: string; score: number; timestamp: number; gameId: string };

type Period = 'all' | 'day' | 'week' | 'month';

type LeaderboardContextValue = {
  submitScore: (user: User, gameId: string, score: number) => void;
  getTop: (opts: { gameId?: string; region?: string; period?: Period; limit?: number; friendsOnly?: boolean; user?: User }) => Entry[];
};

const LB_KEY = 'kv_leaderboards';
const LeaderboardContext = createContext<LeaderboardContextValue | undefined>(undefined);

const read = (): Entry[] => { try { return JSON.parse(localStorage.getItem(LB_KEY) || '[]'); } catch { return []; } };
const write = (rows: Entry[]) => localStorage.setItem(LB_KEY, JSON.stringify(rows));

export const LeaderboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rows, setRows] = useState<Entry[]>([]);

  useEffect(() => { setRows(read()); }, []);
  useEffect(() => { write(rows); }, [rows]);

  const submitScore: LeaderboardContextValue['submitScore'] = (user, gameId, score) => {
    if (!user || typeof score !== 'number' || score <= 0) return;
    const now = Date.now();
    setRows(prev => {
      const filtered = prev.filter(r => !(r.userId === user.id && r.gameId === gameId && r.score < score));
      return [...filtered, { userId: user.id, username: user.username, region: user.region, score, timestamp: now, gameId }];
    });
  };

  const getTop: LeaderboardContextValue['getTop'] = ({ gameId, region, period = 'all', limit = 50, friendsOnly = false, user }) => {
    const now = Date.now();
    const periodMs = period === 'day' ? 86400000 : period === 'week' ? 604800000 : period === 'month' ? 2592000000 : Infinity;
    return rows
      .filter(r => (!gameId || r.gameId === gameId))
      .filter(r => (!region || r.region === region))
      .filter(r => (period === 'all' ? true : now - r.timestamp <= periodMs))
      .filter(r => (!friendsOnly || (user && (user.friends||[]).includes(r.userId) || r.userId === user?.id)))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  };

  const value = useMemo(() => ({ submitScore, getTop }), [rows]);
  return <LeaderboardContext.Provider value={value}>{children}</LeaderboardContext.Provider>;
};

export const useLeaderboard = () => {
  const ctx = useContext(LeaderboardContext);
  if (!ctx) throw new Error('useLeaderboard must be used within LeaderboardProvider');
  return ctx;
};
