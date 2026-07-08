/**
 * AuthGuard — Route protection component.
 *
 * Consumes AuthContext (via useAuth) to determine whether the user is
 * authenticated. If not, renders the login screen. Auth state management
 * (login, logout, token refresh, error handling) is fully delegated to
 * AuthContext — this component is responsible only for the login UI.
 */
import { useState, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Map, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch {
      setError('Invalid credentials. Please check your email and password.');
    }
  };

  if (user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6 backdrop-blur-sm">
            <Map className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="font-serif text-5xl font-light text-white mb-2 tracking-wide">
            MemoryMap
          </h1>
          <span className="inline-block text-xs font-sans font-medium text-amber-400 uppercase tracking-[0.25em] bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
            Public Beta
          </span>
          <p className="mt-4 font-sans text-white/50 text-sm leading-relaxed">
            Your travel photos, transformed into stories.<br />
            GPS extracted locally. Never uploaded.
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="font-serif text-xl font-light text-white/80 mb-6">Sign in to continue</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="font-sans text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-sans text-xs text-white/40 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-sans text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block font-sans text-xs text-white/40 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-11 font-sans text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-black font-sans font-semibold text-sm rounded-lg px-6 py-3.5 transition-all duration-200 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center font-sans text-xs text-white/20 mt-6">
          MemoryMap Beta · MJW Personal App Platform
        </p>
      </div>
    </div>
  );
}
