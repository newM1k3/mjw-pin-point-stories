/**
 * MJW Platform — Hardened AuthContext
 *
 * Point 4 — AuthContext Guard:
 * Listens for the `pb:authError` DOM event (dispatched by the global 403
 * interceptor in pocketbase.ts) to force a clean logout, eliminating
 * infinite loading spinners caused by stale/invalid auth tokens.
 *
 * Also exposes the current PocketBase auth model and a login/logout API
 * for use throughout the application.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { pb } from '../lib/pocketbase';
import type { RecordModel } from 'pocketbase';

interface AuthContextValue {
  user: RecordModel | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(
    pb.authStore.isValid ? (pb.authStore.model as RecordModel) : null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Keep local state in sync with PocketBase auth store changes.
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUser(model as RecordModel | null);
    });
    return () => unsubscribe();
  }, []);

  // Point 4: Listen for the `pb:authError` event dispatched by the global
  // 403 interceptor. Forces a clean logout to prevent infinite spinners.
  useEffect(() => {
    const handleAuthError = () => {
      pb.authStore.clear();
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener('pb:authError', handleAuthError);
    return () => window.removeEventListener('pb:authError', handleAuthError);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authData = await pb
        .collection('users')
        .authWithPassword(email, password);
      setUser(authData.record);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    pb.authStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
