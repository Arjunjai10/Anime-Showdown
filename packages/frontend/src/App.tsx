import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import type { AuthResponse } from './types';
import { FighterLogo } from './components/FighterLogo';
import { useWorkspaceStore } from './stores/workspaceStore';

interface AppState {
  token: string | null;
  userId: string | null;
  username: string | null;
}

const STORAGE_KEY = 'anime-showdown-auth';

function loadAuth(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {}
  return { token: null, userId: null, username: null };
}

function saveAuth(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function App() {
  const [auth, setAuth] = useState<AppState>(loadAuth);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setActiveTab } = useWorkspaceStore();

  function handleLogin(resp: AuthResponse) {
    const next = { token: resp.token, userId: resp.userId, username: resp.username };
    setAuth(next);
    saveAuth(next);
  }

  function handleLogout() {
    setAuth({ token: null, userId: null, username: null });
    localStorage.removeItem(STORAGE_KEY);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { username: form.username, password: form.password }
      : { username: form.username, email: form.email, password: form.password };
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Authentication failed');
      handleLogin(data as AuthResponse);
      setShowModal(false);
      setForm({ username: '', email: '', password: '' });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Navigation Bar ────────────────────────────────────────── */}
      <nav className="nav" style={{ borderBottom: '1px solid var(--glass-border)', zIndex: 200, position: 'relative' }}>
        <Link
          to="/"
          id="nav-logo"
          className="nav-logo"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          onClick={() => setActiveTab('lobby')}
        >
          <FighterLogo id="game-logo" size={28} color="var(--accent)" />
          <span style={{ fontWeight: 900, letterSpacing: '0.05em' }}>ANIME SHOWDOWN</span>
        </Link>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            id="nav-teambuilder-btn"
            className="btn btn-ghost"
            style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => {
              navigate('/');
              setActiveTab('teambuilder');
            }}
          >
            <FighterLogo id="shield" size={16} color="currentColor" />
            <span>Teambuilder</span>
          </button>
          
          <button
            id="nav-battle-btn"
            className="btn btn-primary"
            style={{ padding: '6px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #38BDF8, #4F46E5)' }}
            onClick={() => {
              navigate('/');
              setActiveTab('lobby');
            }}
          >
            <FighterLogo id="swords" size={16} color="#FFF" />
            <span>Battle Lobby</span>
          </button>

          {auth.token ? (
            <button
              id="nav-logout-btn"
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#94A3B8' }}
            >
              {auth.username} (Log Out)
            </button>
          ) : (
            <button
              id="nav-login-btn"
              className="btn btn-ghost"
              style={{ padding: '6px 16px', fontSize: '0.85rem', border: '1px solid var(--accent)', color: 'var(--accent)' }}
              onClick={() => { setMode('login'); setShowModal(true); }}
            >
              Log In / Register
            </button>
          )}
        </div>
      </nav>

      {/* ── Auth Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="winner-overlay" style={{ zIndex: 2000, padding: 16 }}>
          <div className="glass-elevated" style={{ padding: 32, width: '100%', maxWidth: 420, position: 'relative', border: '1px solid var(--accent)' }}>
            <button
              className="inline-text-btn"
              style={{ position: 'absolute', top: 16, right: 20, fontSize: '1.5rem', color: 'var(--text-muted)' }}
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 6 }}>
              {mode === 'login' ? 'Log In to Anime Showdown' : 'Create Showdown Account'}
            </h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: 20 }}>
              {mode === 'login' ? 'Enter your credentials to sync teams and rating.' : 'Join thousands of anime duelists worldwide.'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Username</label>
                <input
                  className="input"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  style={{ marginTop: 4 }}
                  placeholder="DuelistName"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</label>
                  <input
                    className="input"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{ marginTop: 4 }}
                    placeholder="you@example.com"
                  />
                </div>
              )}

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Password</label>
                <input
                  className="input"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{ marginTop: 4 }}
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="form-error" style={{ fontSize: '0.85rem' }}>{error}</p>}

              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 8, height: 42, fontSize: '1rem', fontWeight: 800 }} disabled={loading}>
                {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Sign Up & Battle'}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem' }}>
              {mode === 'login' ? (
                <span style={{ color: 'var(--text-secondary)' }}>
                  Don't have an account?{' '}
                  <button className="inline-text-btn" style={{ color: 'var(--accent)', fontWeight: 700 }} onClick={() => setMode('register')}>
                    Register free
                  </button>
                </span>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>
                  Already registered?{' '}
                  <button className="inline-text-btn" style={{ color: 'var(--accent)', fontWeight: 700 }} onClick={() => setMode('login')}>
                    Log in here
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Page Content ──────────────────────────────────────────── */}
      <Outlet context={{ token: auth.token, username: auth.username, onLogin: handleLogin, onLogout: handleLogout }} />
    </>
  );
}
