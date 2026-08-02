import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useSocket } from '../hooks/useSocket';
import { WorkspaceTabs } from './WorkspaceTabs';
import { LobbyRoom } from './LobbyRoom';
import { TeamBuilder } from './TeamBuilder';
import { BattleArena } from './BattleArena';
import type { Move, AuthResponse, ChatMessage, LobbyUser } from '../types';
import { FighterLogo } from './FighterLogo';

interface ShowdownWorkspaceProps {
  token: string | null;
  username: string | null;
  onLogin: (resp: AuthResponse) => void;
}

export const ShowdownWorkspace: React.FC<ShowdownWorkspaceProps> = ({ token, username, onLogin }) => {
  const { socket } = useSocket();
  const [allMoves, setAllMoves] = useState<Move[]>([]);

  const {
    activeTabId,
    openBattleTabs,
    setActiveTab,
    handleBattleStart,
    handleBattleStateUpdate,
    handleBattleEnd,
    handleBattleError,
    setBattleWaiting,
    addLobbyChatMessage,
    addBattleChatMessage,
    setLobbyUsers,
    closeBattleTab,
  } = useWorkspaceStore();

  useEffect(() => {
    fetch('/api/roster/moves/all').then(r => r.json()).then(data => {
      setAllMoves(data || []);
    }).catch(err => console.error('Error fetching moves in workspace:', err));
  }, []);

  useEffect(() => {
    socket.on('battle:start', ({ battleId, state, yourKey }) => {
      handleBattleStart(battleId, state, yourKey);
    });

    socket.on('battle:stateUpdate', ({ state }) => {
      handleBattleStateUpdate(state.id, state);
    });

    socket.on('battle:end', ({ state, winner }) => {
      handleBattleEnd(state.id, state, winner);
    });

    socket.on('battle:error', ({ message }) => {
      if (activeTabId && openBattleTabs[activeTabId]) {
        handleBattleError(activeTabId, message);
      }
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      if (msg.room === 'lobby') {
        addLobbyChatMessage(msg);
      } else {
        addBattleChatMessage(msg.room, msg);
      }
    });

    socket.on('lobby:users', ({ users }: { users: LobbyUser[] }) => {
      setLobbyUsers(users);
    });

    return () => {
      socket.off('battle:start');
      socket.off('battle:stateUpdate');
      socket.off('battle:end');
      socket.off('battle:error');
      socket.off('chat:message');
      socket.off('lobby:users');
    };
  }, [
    socket,
    activeTabId,
    openBattleTabs,
    handleBattleStart,
    handleBattleStateUpdate,
    handleBattleEnd,
    handleBattleError,
    addLobbyChatMessage,
    addBattleChatMessage,
    setLobbyUsers,
  ]);

  function handleSendBattleChat(battleId: string, text: string) {
    socket.emit('chat:send', { room: battleId, text });
  }

  function handleSelectBattleMove(battleId: string, payload: string | { type: 'move' | 'switch'; moveId?: string; switchIndex?: number }) {
    setBattleWaiting(battleId, true);
    socket.emit('battle:action', typeof payload === 'string' ? { moveId: payload } : payload);
  }

  const activeBattleTab = openBattleTabs[activeTabId];

  return (
    <div className="showdown-workspace" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
      
      {/* Tab Navigation */}
      <WorkspaceTabs />

      {/* Workspace Content */}
      <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
        {activeTabId === 'lobby' && (
          <LobbyRoom token={token} username={username} onLogin={onLogin} />
        )}

        {activeTabId === 'teambuilder' && (
          <TeamBuilder token={token} />
        )}

        {activeBattleTab && (
          <div className="container" style={{ padding: '16px', maxWidth: 1280 }}>
            {/* Battle Room Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '10px 18px', background: 'var(--panel-bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FighterLogo id="swords" size={20} color="var(--text-primary)" />
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{activeBattleTab.title}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ID: {activeBattleTab.battleId.slice(0, 8)}</span>
              </div>
              <div>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 14px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to leave / forfeit this battle room?')) {
                      closeBattleTab(activeBattleTab.battleId);
                      setActiveTab('lobby');
                    }
                  }}
                >
                  Leave Room
                </button>
              </div>
            </div>

            {activeBattleTab.error && (
              <div className="p-3 mb-4" style={{ background: 'var(--panel-bg)', border: '1px solid var(--text-muted)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700 }}>
                ⚠️ {activeBattleTab.error}
              </div>
            )}

            {activeBattleTab.winner && (
              <div style={{ position: 'relative', minHeight: 220, marginBottom: 24, borderRadius: 12, border: '1px solid var(--border-strong)', background: 'var(--card-bg)', boxShadow: '0 10px 40px var(--shadow-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32 }}>
                  <FighterLogo
                    id={activeBattleTab.winner === 'draw' ? 'handshake' : activeBattleTab.winner === activeBattleTab.yourKey ? 'trophy' : 'skull'}
                    size={64}
                    color="var(--text-primary)"
                  />
                  <h2 style={{ fontSize: '2rem', margin: '12px 0 4px', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {activeBattleTab.winner === 'draw' ? 'Battle Drawn!' : activeBattleTab.winner === activeBattleTab.yourKey ? 'Victory Achieved!' : 'Defeated in Combat'}
                  </h2>
                  <p style={{ marginBottom: 20, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {activeBattleTab.winner === 'draw' ? 'Both dueling champions fell simultaneously.' : activeBattleTab.winner === activeBattleTab.yourKey ? 'Your strategies and moveset reigned supreme!' : 'Your team fought valiantly until the end.'}
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-primary" onClick={() => { closeBattleTab(activeBattleTab.battleId); setActiveTab('lobby'); }}>
                      Return to Lobby
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeBattleTab.state && activeBattleTab.yourKey && (
              <BattleArena
                battleId={activeBattleTab.battleId}
                battleState={activeBattleTab.state}
                yourKey={activeBattleTab.yourKey}
                movesData={allMoves}
                isWaiting={activeBattleTab.isWaiting}
                onSelectMove={(payload) => handleSelectBattleMove(activeBattleTab.battleId, payload)}
                onSendChat={(text) => handleSendBattleChat(activeBattleTab.battleId, text)}
                chatMessages={activeBattleTab.chatMessages}
              />
            )}
          </div>
        )}
      </div>

    </div>
  );
};
