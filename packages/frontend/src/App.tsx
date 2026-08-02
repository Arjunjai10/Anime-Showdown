import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import type { AuthResponse } from './types';

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
  const location = useLocation();

  function handleLogin(resp: AuthResponse) {
    const next = { token: resp.token, userId: resp.userId, username: resp.username };
    setAuth(next);
    saveAuth(next);
  }

  function handleLogout() {
    setAuth({ token: null, userId: null, username: null });
    localStorage.removeItem(STORAGE_KEY);
  }

  // Inject auth props into Outlet context
  return (
    <>
      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="nav">
        <Link to="/" id="nav-logo" className="nav-logo">
          Anime<span>⚔</span>Showdown
        </Link>
        <div className="nav-links">
          <Link
            to="/team"
            id="nav-team-link"
            className="btn btn-ghost"
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            Team
          </Link>
          {auth.token ? (
            <>
              <Link
                to="/battle"
                id="nav-battle-link"
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                ⚔️ Battle
              </Link>
              <button
                id="nav-logout-btn"
                onClick={handleLogout}
                className="btn btn-ghost"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                {auth.username}
              </button>
            </>
          ) : (
            <Link to="/" id="nav-login-link" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              Log In
            </Link>
          )}
        </div>
      </nav>

      {/* ── Page content via Outlet ───────────────────────────────── */}
      <Outlet context={{ token: auth.token, username: auth.username, onLogin: handleLogin, onLogout: handleLogout }} />
    </>
  );
}
