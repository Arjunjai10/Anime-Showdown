import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useSocket } from '../hooks/useSocket';
import type { Character, TeamDoc, AuthResponse } from '../types';
import { FighterLogo } from './FighterLogo';
import { FighterSprite } from './FighterSprite';

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
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lobbyChat.length]);

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
      
      {/* ── Matchmaking Dashboard Header (Monochromatic B&W) ────────── */}
      <div
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: '#0D0D0D',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FighterLogo id="game-logo" size={28} color="#FFFFFF" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.04em', color: '#FFF' }}>
              ANIME SHOWDOWN ARENA
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#A3A3A3' }}>
              Select format and deploy your anime squad into tactical real-time PVP matchmaking.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#888888', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>Format</span>
            <select
              className="input"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              disabled={isQueuing}
              style={{ width: 200, height: 36, fontSize: '0.82rem', padding: '0 10px', background: '#050505', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <option value="ou_6v6">[OU] 6v6 Standard Roster</option>
              <option value="blitz_3v3">[Blitz] 3v3 Fast Tactical</option>
              <option value="quick_1v1">[Quick] 1v1 Solo Duel</option>
            </select>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#888888', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>Your Active Team</span>
            <select
              className="input"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={isQueuing}
              style={{ width: 220, height: 36, fontSize: '0.82rem', padding: '0 10px', background: '#050505', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)' }}
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
                style={{ height: 36, padding: '0 20px', fontSize: '0.85rem', fontWeight: 700, background: '#1A1A1A', border: '1px solid #FFF', color: '#FFF', borderRadius: 6, cursor: 'pointer' }}
              >
                Cancel Queue
              </button>
            ) : (
              <button
                onClick={handleJoinQueue}
                style={{ height: 36, padding: '0 26px', fontSize: '0.9rem', fontWeight: 900, background: '#FFFFFF', color: '#000000', border: '1px solid #FFF', borderRadius: 6, cursor: 'pointer', boxShadow: '0 2px 14px rgba(255, 255, 255, 0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
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
            padding: '12px 16px',
            marginBottom: 20,
            background: '#161616',
            border: '1px solid #FFFFFF',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="queue-spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#FFF', borderTopColor: 'transparent' }} />
            <span style={{ fontWeight: 800 }}>Searching for opponent in [{format.toUpperCase().replace('_', ' ')}] queue...</span>
            {queuePosition && <span style={{ opacity: 0.8 }}>(Position: #{queuePosition})</span>}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#AAAAAA' }}>A new match tab will automatically open when found.</span>
        </div>
      )}

      {queueError && (
        <div style={{ padding: '10px 14px', marginBottom: 20, background: '#202020', border: '1px solid #888888', borderRadius: 8, color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 700 }}>
          ⚠️ {queueError}
        </div>
      )}

      {/* ── Main Workspace split: Lobby Chat & Duelist Roster ───────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 28, alignItems: 'stretch' }}>
        
        {/* Lobby Chat Panel */}
        <div
          style={{
            background: '#090909',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            height: 420,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 16px', background: '#141414', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <FighterLogo id="swords" size={16} color="#FFFFFF" />
              Global Showdown Chat
            </span>
            <span style={{ fontSize: '0.75rem', color: '#777777' }}>Respect fellow duelists</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            {lobbyChat.length === 0 ? (
              <div style={{ margin: 'auto', color: '#666666', textAlign: 'center', fontSize: '0.82rem' }}>
                Welcome to Anime Showdown lobby chat! Type a message below to join the discussion.
              </div>
            ) : (
              lobbyChat.map((msg, i) => {
                const isSystem = msg.sender === 'System';
                return (
                  <div key={i} style={{ display: 'flex', gap: 6, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 800, color: isSystem ? '#FFFFFF' : msg.sender === username ? '#E5E5E5' : '#AAAAAA', textDecoration: isSystem ? 'underline' : 'none' }}>
                      {msg.sender}:
                    </span>
                    <span style={{ color: '#FFFFFF' }}>{msg.text}</span>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#141414', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <input
              type="text"
              className="input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message in lobby..."
              maxLength={150}
              style={{ flex: 1, height: 34, fontSize: '0.82rem', padding: '0 12px', background: '#030303', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)' }}
            />
            <button
              type="submit"
              style={{ height: 34, padding: '0 18px', fontSize: '0.8rem', fontWeight: 800, background: '#FFFFFF', border: 'none', color: '#000000', borderRadius: 6, cursor: 'pointer', textTransform: 'uppercase' }}
            >
              Send
            </button>
          </form>
        </div>

        {/* Online Duelist Roster Sidebar */}
        <div
          style={{
            background: '#090909',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            height: 420,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 16px', background: '#141414', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFFFFF', display: 'inline-block', boxShadow: '0 0 8px #FFF' }} />
              Online Duelists ({lobbyUsers.length || 1})
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {lobbyUsers.length === 0 ? (
              <div style={{ padding: 6, fontSize: '0.82rem', color: '#AAAAAA' }}>
                {username || 'You (Connected)'}
              </div>
            ) : (
              lobbyUsers.map((u, idx) => {
                const dotColor = u.status === 'in-battle' ? '#777777' : u.status === 'in-queue' ? '#CCCCCC' : '#FFFFFF';
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6, fontSize: '0.82rem', background: 'rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
                      <span style={{ fontWeight: u.username === username ? 800 : 500, color: '#FFF' }}>
                        {u.username}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#AAAAAA', fontWeight: 600, textTransform: 'capitalize' }}>
                      {u.status.replace('-', ' ')}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ padding: '8px 12px', background: '#141414', borderTop: '1px solid rgba(255, 255, 255, 0.12)', textAlign: 'center', fontSize: '0.72rem', color: '#777777', fontWeight: 600, textTransform: 'uppercase' }}>
            Authoritative Server (WebSocket)
          </div>
        </div>
      </div>

      {/* ── Champion Archetypes Showcase (Monochrome) ────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <FighterLogo id="shield" size={20} color="#FFFFFF" />
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#FFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Anime Champion Roster Showcase
          </h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {roster.map((char) => (
            <div
              key={char.id}
              className="roster-card"
              style={{
                background: '#0D0D0D',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 8,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <FighterSprite id={char.id} size="lg" />
              
              <div style={{ marginTop: 12, width: '100%' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', letterSpacing: '0.02em' }}>{char.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#AAAAAA', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{char.title}</div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.75rem', color: '#DDD' }}>
                  <span><strong style={{ color: '#FFF' }}>HP:</strong> {char.baseStats.maxHp}</span>
                  <span><strong style={{ color: '#FFF' }}>ATK:</strong> {char.baseStats.attack}</span>
                  <span><strong style={{ color: '#FFF' }}>SPD:</strong> {char.baseStats.speed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
