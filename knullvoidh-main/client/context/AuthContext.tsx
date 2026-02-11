import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, signInWithGoogle, resetPassword as firebaseResetPassword } from '@/lib/firebase';

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
  loading: boolean;
  register: (data: { username: string; email: string; password: string; region: string }) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (changes: Partial<User>) => void;
  addFriend: (friendId: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// localStorage keys for extended profile data (achievements, badges, stats, friends)
const PROFILE_KEY_PREFIX = 'kv_profile_';

const readProfile = (uid: string): Omit<User, 'id' | 'username' | 'email'> => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY_PREFIX + uid);
    if (raw) return JSON.parse(raw);
  } catch { }
  return { region: 'Global', achievements: [], badges: [], stats: {}, friends: [] };
};

const writeProfile = (uid: string, data: Omit<User, 'id' | 'username' | 'email'>) => {
  localStorage.setItem(PROFILE_KEY_PREFIX + uid, JSON.stringify(data));
};

const firebaseUserToUser = (fbUser: FirebaseUser): User => {
  const profile = readProfile(fbUser.uid);
  return {
    id: fbUser.uid,
    username: fbUser.displayName || fbUser.email?.split('@')[0] || 'Player',
    email: fbUser.email || '',
    region: profile.region || 'Global',
    avatarUrl: fbUser.photoURL || undefined,
    achievements: profile.achievements || [],
    badges: profile.badges || [],
    stats: profile.stats || {},
    friends: profile.friends || [],
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(firebaseUserToUser(fbUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const register: AuthContextValue['register'] = async ({ username, email, password, region }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Set display name
    await firebaseUpdateProfile(credential.user, { displayName: username });
    // Save extended profile
    writeProfile(credential.user.uid, {
      region,
      achievements: [],
      badges: [],
      stats: {},
      friends: [],
    });
    setUser(firebaseUserToUser(credential.user));
  };

  const login: AuthContextValue['login'] = async (identifier, password) => {
    // Firebase only supports email login, so identifier must be email
    await signInWithEmailAndPassword(auth, identifier, password);
    // State is updated via onAuthStateChanged
  };

  const loginWithGoogle: AuthContextValue['loginWithGoogle'] = async () => {
    const result = await signInWithGoogle();
    // Initialize profile if new Google user
    const existing = localStorage.getItem(PROFILE_KEY_PREFIX + result.user.uid);
    if (!existing) {
      writeProfile(result.user.uid, {
        region: 'Global',
        achievements: [],
        badges: [],
        stats: {},
        friends: [],
      });
    }
    // State is updated via onAuthStateChanged
  };

  const logout: AuthContextValue['logout'] = async () => {
    await signOut(auth);
    setUser(null);
  };

  const resetPasswordFn: AuthContextValue['resetPassword'] = async (email: string) => {
    await firebaseResetPassword(email);
  };

  const updateProfile: AuthContextValue['updateProfile'] = (changes) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...changes, stats: { ...prev.stats, ...(changes.stats || {}) } };
      const { id: _id, username: _u, email: _e, ...profileData } = updated;
      writeProfile(prev.id, profileData);
      return updated;
    });
  };

  const addFriend = (friendId: string) => {
    setUser(prev => {
      if (!prev) return prev;
      if (prev.friends.includes(friendId)) return prev;
      const updated = { ...prev, friends: [...prev.friends, friendId] };
      const { id: _id, username: _u, email: _e, ...profileData } = updated;
      writeProfile(prev.id, profileData);
      return updated;
    });
  };

  const value = useMemo(
    () => ({ user, loading, register, login, loginWithGoogle, logout, resetPassword: resetPasswordFn, updateProfile, addFriend }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
