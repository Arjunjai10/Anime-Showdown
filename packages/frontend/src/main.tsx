import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, useOutletContext, useLocation } from 'react-router-dom';
import App from './App';
import { ShowdownWorkspace } from './components/ShowdownWorkspace';
import { useWorkspaceStore } from './stores/workspaceStore';
import type { AuthResponse } from './types';
import './index.css';

interface OutletCtx {
  token: string | null;
  username: string | null;
  onLogin: (resp: AuthResponse) => void;
  onLogout: () => void;
}

function MainWorkspaceRoute({ initialTab }: { initialTab?: 'lobby' | 'teambuilder' }) {
  const ctx = useOutletContext<OutletCtx>();
  const { setActiveTab } = useWorkspaceStore();
  const location = useLocation();

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, setActiveTab, location]);

  return <ShowdownWorkspace token={ctx.token} username={ctx.username} onLogin={ctx.onLogin} />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true,     element: <MainWorkspaceRoute initialTab="lobby" /> },
      { path: 'battle',  element: <MainWorkspaceRoute initialTab="lobby" /> },
      { path: 'team',    element: <MainWorkspaceRoute initialTab="teambuilder" /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
