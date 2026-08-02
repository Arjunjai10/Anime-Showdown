import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Character, Move } from '../types';
import { useBattleState } from '../hooks/useBattleState';
import { useSocket } from '../hooks/useSocket';
import { useBattleStore } from '../stores/battleStore';
import { BattleArena } from '../components/BattleArena';

const CHAR_META: Record<string, { emoji: string; color: string; accent: string }> = {
  kaze:    { emoji: '🥷', color: '#4F46E5', accent: '#818CF8' },
  ryuu:    { emoji: '🔥', color: '#DC2626', accent: '#F97316' },
  tsubaki: { emoji: '🛡️', color: '#059669', accent: '#34D399' },
  sora:    { emoji: '⚡', color: '#0EA5E9', accent: '#38BDF8' },
  ren:     { emoji: '👊', color: '#D97706', accent: '#FCD34D' },
  hana:    { emoji: '🗡️', color: '#7C3AED', accent: '#A78BFA' },
  mira:    { emoji: '🔮', color: '#BE123C', accent: '#FB7185' },
  gale:    { emoji: '🌪️', color: '#92400E', accent: '#F59E0B' },
};

const MOVE_TYPE_LABEL: Record<string, string> = {
  physical: 'PHY', special: 'SPC', status: 'STS', self: 'SELF',
};
const MOVE_TYPE_COLOR: Record<string, string> = {
  physical: '#F97316', special: '#38BDF8', status: '#A855F7', self: '#3FB950',
};

interface BattlePageProps { token: string | null; }

export const Battle: React.FC<BattlePageProps> = ({ token }) => {
  const navigate = useNavigate();
  const [roster, setRoster] = useState<Character[]>([]);
  const [moves, setMoves] = useState<Move[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [isQueuing, setIsQueuing] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  const { socket, connect, disconnect } = useSocket();
  const { battleState, yourKey, winner, isWaiting, submitAction } = useBattleState();
  const resetBattle = useBattleStore(s => s.resetBattle);

  const movesById = new Map(moves.map(m => [m.id, m]));
  const selected = roster.find(c => c.id === selectedCharId);
  const selectedMoves = selected ? selected.moveIds.map(id => movesById.get(id)).filter(Boolean) as Move[] : [];

  useEffect(() => {
    Promise.all([
      fetch('/api/roster').then(r => r.json()),
      fetch('/api/roster/moves/all').then(r => r.json()),
    ]).then(([chars, movesData]) => { setRoster(chars); setMoves(movesData); });
  }, []);

  useEffect(() => {
    if (!token) navigate('/', { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    socket.on('matchmaking:error', ({ message }) => {
      setQueueError(message);
      setIsQueuing(false);
    });
    return () => { socket.off('matchmaking:error'); };
  }, [socket]);

  function handleJoinQueue() {
    if (!selectedCharId) return;
    setQueueError(null);
    connect();
    setIsQueuing(true);
    socket.once('connect', () => { socket.emit('queue:join', { characterId: selectedCharId }); });
    if (socket.connected) socket.emit('queue:join', { characterId: selectedCharId });
  }

  function handleLeaveQueue() {
    socket.emit('queue:leave');
    disconnect();
    setIsQueuing(false);
    resetBattle();
  }

  function handlePlayAgain() { resetBattle(); setIsQueuing(false); }

  // ── Active battle ─────────────────────────────────────────────────────────
  if (battleState && yourKey) {
    return (
      <div className="page">
        {winner && (
          <div className="winner-overlay">
            <div className="glass-elevated winner-card">
              <div className="winner-emoji">{winner === 'draw' ? '🤝' : winner === yourKey ? '🏆' : '💀'}</div>
              <div className="winner-title">{winner === 'draw' ? 'Draw!' : winner === yourKey ? 'Victory!' : 'Defeated'}</div>
              <p className="text-secondary" style={{ marginBottom: 24 }}>
                {winner === 'draw' ? 'Both fighters fell together.' : winner === yourKey ? 'You dominated the arena.' : 'You fought with honour.'}
              </p>
              <button id="play-again-btn" className="btn btn-primary btn-lg w-full" onClick={handlePlayAgain}>Play Again</button>
            </div>
          </div>
        )}
        <BattleArena battleState={battleState} yourKey={yourKey} movesData={moves} onSelectMove={submitAction} isWaiting={isWaiting} />
      </div>
    );
  }

  // ── Queuing ───────────────────────────────────────────────────────────────
  if (isQueuing) {
    const ch = CHAR_META[selectedCharId ?? ''];
    return (
      <div className="page">
        <div className="queue-overlay">
          <div className="queue-hero-emoji" style={{ color: ch?.color }}>{ch?.emoji ?? '⚔️'}</div>
          <div className="queue-spinner" style={{ borderTopColor: ch?.color ?? 'var(--accent)' }} />
          <h2>Searching for an Opponent</h2>
          <p className="text-secondary">Fielding <span style={{ color: ch?.color }}>{selected?.name}</span></p>
          {queueError && <p className="form-error">{queueError}</p>}
          <button id="leave-queue-btn" className="btn btn-ghost" onClick={handleLeaveQueue}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── Character select ──────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="char-select-layout">

        {/* Left — character grid */}
        <div className="char-select-grid-panel">
          <div className="char-select-header">
            <h2>Select Fighter</h2>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Choose who you'll take into battle</p>
          </div>
          <div className="char-select-grid">
            {roster.map(char => {
              const meta = CHAR_META[char.id] ?? { emoji: '⚔️', color: '#6C63FF', accent: '#818CF8' };
              const isSelected = selectedCharId === char.id;
              return (
                <button
                  key={char.id}
                  id={`select-${char.id}`}
                  className={`char-pick-btn ${isSelected ? 'char-pick-selected' : ''}`}
                  style={{ '--pick-color': meta.color } as React.CSSProperties}
                  onClick={() => setSelectedCharId(char.id)}
                >
                  <span className="char-pick-emoji">{meta.emoji}</span>
                  <span className="char-pick-name" style={{ color: isSelected ? meta.color : undefined }}>{char.name}</span>
                  <span className="char-pick-title">{char.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — detail panel */}
        <div className="char-select-detail-panel">
          {selected ? (() => {
            const meta = CHAR_META[selected.id] ?? { emoji: '⚔️', color: '#6C63FF', accent: '#818CF8' };
            return (
              <>
                {/* Avatar */}
                <div className="char-detail-avatar" style={{ background: `radial-gradient(circle at 50% 40%, ${meta.color}30 0%, transparent 70%)`, boxShadow: `0 0 80px ${meta.color}30` }}>
                  <span style={{ fontSize: '5rem' }}>{meta.emoji}</span>
                </div>

                {/* Identity */}
                <div className="char-detail-name" style={{ color: meta.color }}>{selected.name}</div>
                <div className="char-detail-title">{selected.title}</div>
                <p className="char-detail-desc text-secondary">{selected.description}</p>

                {/* Stats */}
                <div className="char-detail-stats">
                  {([
                    { key: 'maxHp', label: 'HP', bar: true, max: 1400 },
                    { key: 'attack', label: 'ATK', bar: true, max: 140 },
                    { key: 'defense', label: 'DEF', bar: true, max: 140 },
                    { key: 'special', label: 'SPC', bar: true, max: 140 },
                    { key: 'speed', label: 'SPD', bar: true, max: 140 },
                  ] as const).map(({ key, label, max }) => {
                    const val = selected.baseStats[key as keyof typeof selected.baseStats];
                    const pct = Math.round((val / max) * 100);
                    return (
                      <div key={key} className="char-stat-row">
                        <span className="char-stat-label">{label}</span>
                        <div className="char-stat-bar-track">
                          <div className="char-stat-bar-fill" style={{ width: `${pct}%`, background: meta.color, boxShadow: `0 0 8px ${meta.color}80` }} />
                        </div>
                        <span className="char-stat-value" style={{ color: meta.accent }}>{val}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Moves */}
                <div className="char-detail-moves-title">Moveset</div>
                <div className="char-detail-moves">
                  {selectedMoves.map(move => (
                    <div key={move.id} className="char-move-row">
                      <span className="char-move-type-badge" style={{ background: `${MOVE_TYPE_COLOR[move.type]}20`, color: MOVE_TYPE_COLOR[move.type] }}>
                        {MOVE_TYPE_LABEL[move.type]}
                      </span>
                      <div className="char-move-info">
                        <span className="char-move-name">{move.name}</span>
                        <span className="char-move-desc text-muted">{move.description}</span>
                      </div>
                      <div className="char-move-stats">
                        {move.power && <span>PWR {move.power}</span>}
                        <span style={{ color: 'var(--energy-color)' }}>⚡{move.energyCost}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button id="enter-queue-btn" className="btn btn-primary btn-lg w-full"
                  style={{ marginTop: 'auto', boxShadow: `0 6px 30px ${meta.color}50` }}
                  onClick={handleJoinQueue}>
                  ⚔️ Fight with {selected.name}
                </button>
              </>
            );
          })() : (
            <div className="char-detail-empty">
              <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.3 }}>⚔️</div>
              <p className="text-secondary">Select a fighter to see their full stats and moves</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
