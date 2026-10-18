import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, type User } from 'firebase/auth';
import { database, type UserProfile } from '../services/database';

// Toast types
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Auth context
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  googleLogin: () => Promise<void>;
  authBusy: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Theme context
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Toast context
interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

// Auth Provider
const AuthContext = createContext<AuthContextType | null>(null);
const ThemeContext = createContext<ThemeContextType | null>(null);
const ToastContext = createContext<ToastContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const authLock = useRef(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('lumina-theme') as any) || 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Theme management
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      let resolved: 'light' | 'dark';
      if (theme === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      setResolvedTheme(resolved);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  const setTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    localStorage.setItem('lumina-theme', newTheme);
  }, []);

  // Toast management
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      try {
        if (firebaseUser) {
          const userProfile = await database.getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const authenticate = async (action: () => Promise<void>) => {
    if (authLock.current) throw new Error('Sign-in is already in progress.');
    authLock.current = true; setAuthBusy(true);
    try { await action(); } finally { authLock.current = false; setAuthBusy(false); }
  };
  const googleLogin = () => authenticate(async () => {
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      let existing = await database.getUserProfile(credential.user.uid);
      if (!existing) {
        existing = { uid: credential.user.uid, email: credential.user.email || '', name: credential.user.displayName || 'Photographer', role: 'client', subscriptionPlan: 'free', createdAt: new Date().toISOString() };
        await database.createUserProfile(credential.user.uid, existing);
      }
      setProfile(existing);
    } catch (error: any) {
      const messages: Record<string, string> = {
        'auth/popup-blocked': 'Your browser blocked Google sign-in. Allow popups for this site and try again.',
        'auth/popup-closed-by-user': 'Google sign-in was closed. Please try again when ready.',
        'auth/cancelled-popup-request': 'Another sign-in is already open. Complete it first.',
        'auth/unauthorized-domain': 'Google sign-in is unavailable on this domain. Ask the studio administrator to authorize it in Firebase.',
        'auth/operation-not-allowed': 'Google sign-in must be enabled in Firebase Authentication.',
        'auth/account-exists-with-different-credential': 'This email already uses another sign-in method. Sign in with your existing method to keep your account.',
        'auth/network-request-failed': 'Could not connect. Check your internet connection and try again.',
      };
      throw new Error(messages[error.code] || 'Google sign-in failed. Please try again.');
    }
  });
  const login = (email: string, password: string) => authenticate(async () => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await database.getUserProfile(cred.user.uid);
    setProfile(userProfile);
  });

  const register = (email: string, password: string, name: string) => authenticate(async () => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email,
      name,
      role: 'client',
      subscriptionPlan: 'free',
      createdAt: new Date().toISOString()
    };
    await database.createUserProfile(cred.user.uid, newProfile);
    setProfile(newProfile);
  });

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await database.getUserProfile(user.uid);
      setProfile(p);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, googleLogin, authBusy, login, register, logout, resetPassword, refreshProfile }}>
      <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
          {children}
        </ToastContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

// Hooks
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AppProvider');
  return ctx;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within AppProvider');
  return ctx;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within AppProvider');
  return ctx;
}
