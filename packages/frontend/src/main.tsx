import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, useOutletContext } from 'react-router-dom';
import App from './App';
import { Home } from './pages/Home';
import { Battle } from './pages/Battle';
import { TeamBuilderPage } from './pages/TeamBuilderPage';
import type { AuthResponse } from './types';
import './index.css';

interface OutletCtx {
  token: string | null;
  username: string | null;
  onLogin: (resp: AuthResponse) => void;
  onLogout: () => void;
}

function HomePage() {
  const ctx = useOutletContext<OutletCtx>();
  return <Home token={ctx.token} username={ctx.username} onLogin={ctx.onLogin} onLogout={ctx.onLogout} />;
}

function BattlePage() {
  const ctx = useOutletContext<OutletCtx>();
  return <Battle token={ctx.token} />;
}

function TeamPage() {
  const ctx = useOutletContext<OutletCtx>();
  return <TeamBuilderPage token={ctx.token} />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true,     element: <HomePage /> },
      { path: 'battle',  element: <BattlePage /> },
      { path: 'team',    element: <TeamPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
