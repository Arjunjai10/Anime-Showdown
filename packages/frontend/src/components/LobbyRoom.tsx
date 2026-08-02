import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useSocket } from '../hooks/useSocket';
import type { Character, TeamDoc, AuthResponse } from '../types';
import { FighterLogo } from './FighterLogo';

interface LobbyRoomProps {
  token: string | null;
  username: string | null;
  onLogin: (resp: AuthResponse) => void;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({ token, username }) => {
  const [roster, setRoster] = useState<Character[]>([]);
  const [teams, setTeams] = useState<TeamDoc[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('starter:kaze');
  const [format, setFormat] = useState<string>('ou_6v6');
  const [chatInput, setChatInput] = useState('');

  const { socket, connect } = useSocket();
  const {
    lobbyChat,
    lobbyUsers,
    isQueuing,
    queuePosition,
    queueError,
    setQueuing,
    setQueueStatus,
    setQueueError,
  } = useWorkspaceStore();
  
  const { showLobbyChat } = useSettingsStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/roster').then(r => r.json()),
      token ? fetch('/api/teams', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()) : Promise.resolve([]),
    ]).then(([chars, userTeams]) => {
      setRoster(chars || []);
      setTeams(userTeams || []);
      if (userTeams && userTeams.length > 0) {
        setSelectedTeamId(`team:${userTeams[0].id}`);
      }
    });
  }, [token]);

  useEffect(() => {
    connect();
    socket.emit('lobby:join');

    const handleQueueStatus = ({ position, format }: { position: number; format?: string }) => {
      setQueueStatus(position, format || 'ou_6v6');
    };
    const handleQueueError = ({ message }: { message: string }) => {
      setQueueError(message);
    };

    socket.on('queue:status', handleQueueStatus);
    socket.on('matchmaking:error', handleQueueError);

    return () => {
      socket.off('queue:status', handleQueueStatus);
      socket.off('matchmaking:error', handleQueueError);
    };
  }, [socket, connect, setQueueStatus, setQueueError]);

  useEffect(() => {
    if (showLobbyChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lobbyChat.length, showLobbyChat]);

  function handleJoinQueue() {
    setQueuing(true, format);
    if (selectedTeamId.startsWith('team:')) {
      const tid = selectedTeamId.replace('team:', '');
      const selectedTeam = teams.find(t => t.id === tid);
      socket.emit('queue:join', { format, team: selectedTeam });
    } else {
      const cid = selectedTeamId.replace('starter:', '');
      socket.emit('queue:join', { format, characterId: cid });
    }
  }

  function handleLeaveQueue() {
    socket.emit('queue:leave');
    setQueuing(false);
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('chat:send', { room: 'lobby', text: chatInput });
    setChatInput('');
  }

  return (
    <div className="container" style={{ padding: '20px 24px', maxWidth: 1280, margin: '0 auto' }}>
      
      {/* ── Matchmaking Dashboard Header (Theme Responsive) ────────── */}
      <div
        style={{
          padding: '18px 22px',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: '0 4px 20px var(--shadow-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FighterLogo id="game-logo" size={32} color="var(--text-primary)" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              ANIME SHOWDOWN ARENA
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Select format and deploy your anime squad into tactical real-time PVP matchmaking.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Format</span>
            <select
              className="input"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              disabled={isQueuing}
              style={{ width: 200, height: 38, fontSize: '0.82rem', padding: '0 10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="ou_6v6">[OU] 6v6 Standard Roster</option>
              <option value="blitz_3v3">[Blitz] 3v3 Fast Tactical</option>
              <option value="quick_1v1">[Quick] 1v1 Solo Duel</option>
            </select>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Your Active Team</span>
            <select
              className="input"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={isQueuing}
              style={{ width: 220, height: 38, fontSize: '0.82rem', padding: '0 10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <optgroup label="Custom Saved Teams">
                {teams.map(t => (
                  <option key={t.id} value={`team:${t.id}`}>{t.name} ({t.slots?.length || t.characterIds?.length || 1} fighters)</option>
                ))}
                {teams.length === 0 && <option disabled value="">No custom teams yet</option>}
              </optgroup>
              <optgroup label="Default Lead Fighters">
                {roster.map(c => (
                  <option key={c.id} value={`starter:${c.id}`}>[Starter] {c.name} ({c.title})</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            {isQueuing ? (
              <button
                onClick={handleLeaveQueue}
                style={{ height: 38, padding: '0 20px', fontSize: '0.85rem', fontWeight: 700, background: 'var(--panel-header)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', borderRadius: 6, cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Cancel Queue
              </button>
            ) : (
              <button
                onClick={handleJoinQueue}
                className="btn btn-primary"
                style={{ height: 38, padding: '0 28px', fontSize: '0.95rem', fontWeight: 900, borderRadius: 6, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Battle!
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Queue Status Notice */}
      {isQueuing && (
        <div
          style={{
            padding: '14px 18px',
            marginBottom: 20,
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 15px var(--shadow-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="queue-spinner" style={{ width: 20, height: 20, borderWidth: 2, borderColor: 'var(--text-primary)', borderTopColor: 'transparent' }} />
            <span style={{ fontWeight: 800 }}>Searching for opponent in [{format.toUpperCase().replace('_', ' ')}] queue...</span>
            {queuePosition ? <span style={{ opacity: 0.8 }}>(Position: #{queuePosition})</span> : null}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>A new match tab will automatically open when found.</span>
        </div>
      )}

      {queueError && (
        <div style={{ padding: '10px 14px', marginBottom: 20, background: 'var(--panel-bg)', border: '1px solid var(--text-muted)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700 }}>
          ⚠️ {queueError}
        </div>
      )}

      {/* ── Main Workspace split: Lobby Chat & Duelist Roster ───────── */}
      <div style={{ display: 'grid', gridTemplateColumns: showLobbyChat ? '1fr 300px' : '1fr', gap: 20, marginBottom: 28, alignItems: 'stretch' }}>
        
        {/* Lobby Chat Panel */}
        {showLobbyChat ? (
          <div
            style={{
              background: 'var(--panel-bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              height: 420,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '10px 16px', background: 'var(--panel-header)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <FighterLogo id="swords" size={16} color="var(--text-primary)" />
                Global Showdown Chat
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Respect fellow duelists</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
              {lobbyChat.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.82rem' }}>
                  Welcome to Anime Showdown lobby chat! Type a message below to join the discussion.
                </div>
              ) : (
                lobbyChat.map((msg, i) => {
                  const isSystem = msg.sender === 'System';
                  return (
                    <div key={i} style={{ display: 'flex', gap: 6, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 800, color: isSystem ? 'var(--text-primary)' : msg.sender === username ? 'var(--text-primary)' : 'var(--text-secondary)', textDecoration: isSystem ? 'underline' : 'none' }}>
                        {msg.sender}:
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{msg.text}</span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'var(--panel-header)', borderTop: '1px solid var(--border)' }}>
              <input
                type="text"
                className="input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message in lobby..."
                maxLength={150}
                style={{ flex: 1, height: 34, fontSize: '0.82rem', padding: '0 12px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ height: 34, padding: '0 18px', fontSize: '0.8rem', borderRadius: 6, cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Send
              </button>
            </form>
          </div>
        ) : (
          <div style={{ background: 'var(--panel-bg)', border: '1px dashed var(--border)', borderRadius: 8, padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div>Global Lobby Chat is currently disabled in your User Settings.</div>
          </div>
        )}

        {/* Online Duelist Roster Sidebar */}
        <div
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            height: 420,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 16px', background: 'var(--panel-header)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-primary)', display: 'inline-block', boxShadow: '0 0 8px var(--text-primary)' }} />
              Online Duelists ({lobbyUsers.length || 1})
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {lobbyUsers.length === 0 ? (
              <div style={{ padding: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {username || 'You (Connected)'}
              </div>
            ) : (
              lobbyUsers.map((u, idx) => {
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6, fontSize: '0.82rem', background: 'var(--bg-surface-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-primary)', display: 'inline-block' }} />
                      <span style={{ fontWeight: u.username === username ? 800 : 500, color: 'var(--text-primary)' }}>
                        {u.username}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'capitalize' }}>
                      {u.status.replace('-', ' ')}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ padding: '8px 12px', background: 'var(--panel-header)', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Authoritative Server (WebSocket)
          </div>
        </div>
      </div>

    </div>
  );
};
