import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Achievement = { id: string; name: string; desc: string; icon?: string };
export type Badge = { id: string; name: string; color: string };
export type GameStats = { highScore: number; plays: number; lastPlayed?: number };

export type User = {
  id: string;
  username: string;
  email: string;
  region: string;
  avatarUrl?: string;
  achievements: Achievement[];
  badges: Badge[];
  stats: Record<string, GameStats>; // gameId -> stats
  friends: string[]; // user ids
};

type AuthContextValue = {
  user: User | null;
  register: (data: { username: string; email: string; password: string; region: string }) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (changes: Partial<User>) => void;
  addFriend: (friendId: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USERS_KEY = 'kv_users';
const CURRENT_USER_KEY = 'kv_user';

const readUsers = (): Record<string, User & { password: string }> => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
};
const writeUsers = (u: Record<string, User & { password: string }>) => localStorage.setItem(USERS_KEY, JSON.stringify(u));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(CURRENT_USER_KEY);
  }, [user]);

  const register: AuthContextValue['register'] = async ({ username, email, password, region }) => {
    const users = readUsers();
    const id = crypto.randomUUID();
    const exists = Object.values(users).some(u => u.email === email || u.username === username);
    if (exists) throw new Error('User already exists');
    const newUser: User & { password: string } = {
      id, username, email, region, password,
      avatarUrl: undefined, achievements: [], badges: [], stats: {}, friends: []
    };
    users[id] = newUser; writeUsers(users);
    const { password: _pw, ...publicUser } = newUser;
    setUser(publicUser as User);
  };

  const login: AuthContextValue['login'] = async (identifier, password) => {
    const users = readUsers();
    const entry = Object.values(users).find(u => (u.email === identifier || u.username === identifier) && u.password === password);
    if (!entry) throw new Error('Invalid credentials');
    const { password: _pw, ...publicUser } = entry;
    setUser(publicUser as User);
  };

  const logout = () => setUser(null);

  const updateProfile: AuthContextValue['updateProfile'] = (changes) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...changes, stats: { ...prev.stats, ...(changes.stats||{}) } };
      const users = readUsers();
      const old = users[prev.id];
      users[prev.id] = { ...(old||({} as any)), ...updated, password: old?.password || '' };
      writeUsers(users);
      return updated;
    });
  };

  const addFriend = (friendId: string) => {
    setUser(prev => {
      if (!prev) return prev;
      if (prev.friends.includes(friendId)) return prev;
      const updated = { ...prev, friends: [...prev.friends, friendId] };
      const users = readUsers();
      const me = users[prev.id];
      users[prev.id] = { ...me, friends: updated.friends };
      writeUsers(users);
      return updated;
    });
  };

  const value = useMemo(() => ({ user, register, login, logout, updateProfile, addFriend }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
