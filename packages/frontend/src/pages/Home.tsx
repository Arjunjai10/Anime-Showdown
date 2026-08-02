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

const ROSTER = [
  { id: 'kaze',    name: 'Kaze',    title: 'Phantom Blade',   emoji: '🥷', color: '#4F46E5', tag: 'Ninja · Speed',          desc: 'Fastest in the arena. Wins through poison and precision.' },
  { id: 'ryuu',    name: 'Ryuu',    title: 'Eternal Flame',   emoji: '🔥', color: '#DC2626', tag: 'Fighter · Power',        desc: 'Pure offensive force. Dragon Fist ends fights in one move.' },
  { id: 'tsubaki', name: 'Tsubaki', title: 'Iron Lotus',      emoji: '🛡️', color: '#059669', tag: 'Warrior · Tank',         desc: 'Laughs at everything you throw. Still standing at the end.' },
  { id: 'sora',    name: 'Sora',    title: 'Stormcaller',     emoji: '⚡', color: '#0EA5E9', tag: 'Mage · Elemental',       desc: 'Storm\'s Eye hits like a comet. Hard to stay alive that long.' },
  { id: 'ren',     name: 'Ren',     title: 'Thunder Fist',    emoji: '👊', color: '#D97706', tag: 'Brawler · Electric',     desc: 'Heavy punches, lightning speed. The electric berserker.' },
  { id: 'hana',    name: 'Hana',    title: 'Void Walker',     emoji: '🗡️', color: '#7C3AED', tag: 'Assassin · Shadow',      desc: 'Strikes from impossible angles. 0 HP before you knew she moved.' },
  { id: 'mira',    name: 'Mira',    title: 'Cursed Sage',     emoji: '🔮', color: '#BE123C', tag: 'Dark Mage · Curse',      desc: 'Forbidden Art is a one-shot. Don\'t let her survive long enough.' },
  { id: 'gale',    name: 'Gale',    title: 'Wild Tempest',    emoji: '🌪️', color: '#92400E', tag: 'Berserker · Wild',       desc: 'Gets stronger as the fight drags on. Berserk Mode is terrifying.' },
];

export const Home: React.FC<HomeProps> = ({ token, username, onLogin, onLogout }) => {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      onLogin(data as AuthResponse);
      setShowModal(false);
      setForm({ username: '', email: '', password: '' });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally { setLoading(false); }
  }

  return (
    <div className="page">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">⚔️ 8 Fighters · PvP Battle Arena</div>
          <h1 className="home-hero-title">
            <span className="home-hero-title-main">ANIME</span>
            <span className="home-hero-title-accent">SHOWDOWN</span>
          </h1>
          <p className="home-hero-sub">
            Build your team. Master your moveset. Fight for glory.
          </p>
          <div className="home-hero-actions">
            {token ? (
              <>
                <Link to="/battle" id="queue-btn" className="btn btn-primary btn-lg">⚔️ Fight Now</Link>
                <Link to="/team" id="team-btn" className="btn btn-ghost btn-lg">🛡️ My Team</Link>
              </>
            ) : (
              <>
                <button id="play-now-btn" className="btn btn-primary btn-lg"
                  onClick={() => { setMode('register'); setShowModal(true); }}>
                  ⚔️ Play Free
                </button>
                <button id="login-btn" className="btn btn-ghost btn-lg"
                  onClick={() => { setMode('login'); setShowModal(true); }}>
                  Log In
                </button>
              </>
            )}
          </div>
          {token && (
            <p className="home-hero-user">
              Playing as <span className="text-accent">{username}</span>
              {' · '}
              <button id="logout-btn" className="inline-text-btn" onClick={onLogout}>Log out</button>
            </p>
          )}
        </div>

        {/* Floating fighter emojis */}
        <div className="home-hero-fighters" aria-hidden="true">
          {ROSTER.map((f, i) => (
            <div key={f.id} className="hero-float-fighter" style={{
              animationDelay: `${i * 0.4}s`,
              color: f.color,
              fontSize: i % 3 === 0 ? '3.5rem' : i % 3 === 1 ? '2.8rem' : '2.2rem',
            }}>
              {f.emoji}
            </div>
          ))}
        </div>
      </section>

      {/* ── ROSTER ───────────────────────────────────────────────────────────── */}
      <section className="home-roster-section">
        <div className="container">
          <div className="home-section-header">
            <h2>Choose Your Fighter</h2>
            <p className="text-secondary">8 unique archetypes. Every style wins differently.</p>
          </div>

          <div className="roster-grid">
            {ROSTER.map(char => (
              <div key={char.id} className="roster-card" style={{ '--char-color': char.color } as React.CSSProperties}>
                <div className="roster-card-emoji">{char.emoji}</div>
                <div className="roster-card-body">
                  <div className="roster-card-name" style={{ color: char.color }}>{char.name}</div>
                  <div className="roster-card-title">{char.title}</div>
                  <div className="roster-card-tag">{char.tag}</div>
                  <p className="roster-card-desc">{char.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {!token && (
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <button id="cta-register-btn" className="btn btn-primary btn-lg"
                onClick={() => { setMode('register'); setShowModal(true); }}>
                Create Account to Play
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="home-how-section">
        <div className="container">
          <div className="home-section-header">
            <h2>How It Works</h2>
          </div>
          <div className="how-steps">
            {[
              { icon: '🎯', step: '01', title: 'Pick a Fighter', desc: 'Choose from 8 unique characters, each with different stats and movesets.' },
              { icon: '⚔️', step: '02', title: 'Enter the Queue', desc: 'Get matched against a real opponent. Both players pick moves simultaneously each turn.' },
              { icon: '🏆', step: '03', title: 'Win the Arena', desc: 'Outsmart and outplay your opponent. The last fighter standing wins.' },
            ].map(s => (
              <div key={s.step} className="how-step">
                <div className="how-step-num">{s.step}</div>
                <div className="how-step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p className="text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTH MODAL ───────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-elevated modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            <h2 style={{ marginBottom: 24 }}>
              {mode === 'login' ? 'Welcome Back' : 'Join the Arena'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-username">Username</label>
                <input id="auth-username" className="input" type="text" name="username"
                  value={form.username} onChange={handleChange} placeholder="Your username"
                  required autoComplete="username" />
              </div>
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-email">Email</label>
                  <input id="auth-email" className="input" type="email" name="email"
                    value={form.email} onChange={handleChange} placeholder="you@example.com"
                    required autoComplete="email" />
                </div>
              )}
              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Password</label>
                <input id="auth-password" className="input" type="password" name="password"
                  value={form.password} onChange={handleChange} placeholder="••••••••"
                  required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button id="auth-submit-btn" type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Loading…' : mode === 'login' ? 'Log In' : 'Create Account'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button id="auth-switch-mode-btn" className="inline-text-btn"
                onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null); }}>
                {mode === 'login' ? 'Register' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
