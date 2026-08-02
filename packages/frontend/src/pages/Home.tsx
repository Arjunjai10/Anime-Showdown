import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AuthResponse } from '../types';

interface HomeProps {
  token: string | null;
  username: string | null;
  onLogin: (resp: AuthResponse) => void;
  onLogout: () => void;
}

type AuthMode = 'login' | 'register';

export const Home: React.FC<HomeProps> = ({ token, username, onLogin, onLogout }) => {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Authentication failed');
      onLogin(data as AuthResponse);
      setShowModal(false);
      setForm({ username: '', email: '', password: '' });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">ANIME SHOWDOWN</h1>
        <p className="hero-subtitle">
          Choose your fighter. Master their moves. Prove your worth in the arena.
        </p>

        <div className="flex gap-4" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          {token ? (
            <>
              <Link to="/battle" id="queue-btn" className="btn btn-primary btn-lg">
                ⚔️ Enter Queue
              </Link>
              <Link to="/team" id="team-btn" className="btn btn-ghost btn-lg">
                🛡️ Build Team
              </Link>
            </>
          ) : (
            <>
              <button
                id="play-now-btn"
                className="btn btn-primary btn-lg"
                onClick={() => { setMode('register'); setShowModal(true); }}
              >
                ⚔️ Play Now
              </button>
              <button
                id="login-btn"
                className="btn btn-ghost btn-lg"
                onClick={() => { setMode('login'); setShowModal(true); }}
              >
                Log In
              </button>
            </>
          )}
        </div>

        {token && (
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            Playing as <span className="text-accent">{username}</span>
            {' · '}
            <button
              id="logout-btn"
              onClick={onLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'underline' }}
            >
              Log out
            </button>
          </p>
        )}
      </section>

      {/* Character showcase */}
      <section className="container" style={{ paddingBottom: 80 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 32 }}>The Roster</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          {[
            { id: 'kaze', name: 'Kaze', title: 'The Phantom Blade', emoji: '🥷', color: '#4F46E5', archetype: 'Ninja / Speed', desc: 'Strikes before the enemy can react.' },
            { id: 'ryuu', name: 'Ryuu', title: 'The Eternal Flame', emoji: '🔥', color: '#DC2626', archetype: 'Fighter / Power', desc: 'Obliterates opponents with raw power.' },
            { id: 'tsubaki', name: 'Tsubaki', title: 'The Iron Lotus', emoji: '🛡️', color: '#059669', archetype: 'Warrior / Tank', desc: 'Outlasts every challenge through iron will.' },
            { id: 'sora', name: 'Sora', title: 'The Stormcaller', emoji: '⚡', color: '#0EA5E9', archetype: 'Mage / Elemental', desc: 'Commands lightning and ice with deadly precision.' },
          ].map(char => (
            <div key={char.id} className="glass-elevated" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>{char.emoji}</div>
              <h3 style={{ color: char.color, fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.05em' }}>{char.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{char.title}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{char.desc}</p>
              <div
                style={{
                  marginTop: 12,
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: `${char.color}20`,
                  color: char.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {char.archetype}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Auth modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="glass-elevated modal"
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 24 }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-username">Username</label>
                <input
                  id="auth-username"
                  className="input"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Your username"
                  required
                  autoComplete="username"
                />
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-email">Email</label>
                  <input
                    id="auth-email"
                    className="input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  className="input"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {error && <p className="form-error">{error}</p>}

              <button
                id="auth-submit-btn"
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Loading…' : mode === 'login' ? 'Log In' : 'Create Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                id="auth-switch-mode-btn"
                onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}
              >
                {mode === 'login' ? 'Register' : 'Log In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
