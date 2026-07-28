import { useEffect, useState, type FC, type FormEvent } from 'react';
import { CheckCircle2, Loader2, LogIn, UserPlus, X } from 'lucide-react';
import type { AuthSession } from '../types';
import { loginUser, registerUser } from '../services/api';

interface AuthModalProps {
  onClose: () => void;
  onAuthenticated: (session: AuthSession, mode: AuthMode) => void;
  onError?: (message: string) => void;
}

type AuthMode = 'login' | 'register';

/**
 * Email/password login + register modal backed by /api/auth/*.
 */
export const AuthModal: FC<AuthModalProps> = ({ onClose, onAuthenticated, onError }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(onClose, 1400);
    return () => window.clearTimeout(timer);
  }, [successMessage, onClose]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const session =
        mode === 'login'
          ? await loginUser(trimmedEmail, password)
          : await registerUser(trimmedEmail, password);
      onAuthenticated(session, mode);
      setSuccessMessage(mode === 'login' ? 'Login successful' : 'Account created successfully');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { msg?: string } }; message?: string })?.response?.data?.msg ||
        (err as { message?: string })?.message ||
        (mode === 'login' ? 'Login failed.' : 'Registration failed.');
      setError(message);
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-neutral-light transition hover:bg-neutral-bgLight hover:text-neutral-dark"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {mode === 'login' ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-xl font-extrabold text-neutral-dark">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm text-neutral-light">
              {mode === 'login' ? 'Sign in with your email' : 'Register with email — no verification needed'}
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center" role="status" aria-live="polite">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-emerald-800">{successMessage}</h3>
            <p className="mt-2 text-sm font-semibold text-emerald-700">
              {mode === 'login' ? 'Welcome back. You are now signed in.' : 'Your account is ready to use.'}
            </p>
          </div>
        ) : (
          <>
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-neutral-bgLight p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-full py-2 text-sm font-bold transition ${
              mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-neutral-medium hover:text-neutral-dark'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-full py-2 text-sm font-bold transition ${
              mode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-neutral-medium hover:text-neutral-dark'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-light">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-light">Password</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
          </>
        )}
      </div>
    </div>
  );
};
