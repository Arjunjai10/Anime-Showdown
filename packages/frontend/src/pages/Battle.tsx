import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Character, Move } from '../types';
import { useBattleState } from '../hooks/useBattleState';
import { useSocket } from '../hooks/useSocket';
import { useBattleStore } from '../stores/battleStore';
import { BattleArena } from '../components/BattleArena';
import { CharacterCard } from '../components/CharacterCard';

interface BattlePageProps {
  token: string | null;
}

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

  // Load roster and moves once
  useEffect(() => {
    Promise.all([
      fetch('/api/roster').then(r => r.json()),
      fetch('/api/roster/moves/all').then(r => r.json()),
    ]).then(([chars, movesData]) => {
      setRoster(chars);
      setMoves(movesData);
    });
  }, []);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!token) navigate('/', { replace: true });
  }, [token, navigate]);

  // Socket matchmaking listeners
  useEffect(() => {
    socket.on('matchmaking:error', ({ message }) => {
      setQueueError(message);
      setIsQueuing(false);
    });

    return () => {
      socket.off('matchmaking:error');
    };
  }, [socket]);

  function handleJoinQueue() {
    if (!selectedCharId) return;
    setQueueError(null);
    connect();
    setIsQueuing(true);
    socket.once('connect', () => {
      socket.emit('queue:join', { characterId: selectedCharId });
    });
    // If already connected
    if (socket.connected) {
      socket.emit('queue:join', { characterId: selectedCharId });
    }
  }

  function handleLeaveQueue() {
    socket.emit('queue:leave');
    disconnect();
    setIsQueuing(false);
    resetBattle();
  }

  function handlePlayAgain() {
    resetBattle();
    setIsQueuing(false);
  }

  // ── Active battle ──────────────────────────────────────────────────────────
  if (battleState && yourKey) {
    return (
      <div className="page">
        {/* Winner overlay */}
        {winner && (
          <div className="winner-overlay">
            <div className="glass-elevated winner-card">
              <div className="winner-emoji">
                {winner === 'draw' ? '🤝' : winner === yourKey ? '🏆' : '💀'}
              </div>
              <div className="winner-title">
                {winner === 'draw' ? 'Draw!' : winner === yourKey ? 'Victory!' : 'Defeated'}
              </div>
              <p className="text-secondary" style={{ marginBottom: 24 }}>
                {winner === 'draw'
                  ? 'Both fighters fell at the same time.'
                  : winner === yourKey
                  ? 'You dominated the arena.'
                  : 'You fought with honor.'}
              </p>
              <button id="play-again-btn" className="btn btn-primary btn-lg w-full" onClick={handlePlayAgain}>
                Play Again
              </button>
            </div>
          </div>
        )}
        <BattleArena
          battleState={battleState}
          yourKey={yourKey}
          movesData={moves}
          onSelectMove={submitAction}
          isWaiting={isWaiting}
        />
      </div>
    );
  }

  // ── Queuing ────────────────────────────────────────────────────────────────
  if (isQueuing) {
    return (
      <div className="page">
        <div className="queue-overlay">
          <div className="queue-spinner" />
          <h2>Finding an Opponent…</h2>
          <p className="text-secondary">
            Fielding <span className="text-accent">{roster.find(c => c.id === selectedCharId)?.name}</span>
          </p>
          {queueError && <p className="form-error">{queueError}</p>}
          <button id="leave-queue-btn" className="btn btn-ghost" onClick={handleLeaveQueue}>
            Leave Queue
          </button>
        </div>
      </div>
    );
  }

  // ── Character select ───────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <h2 style={{ marginBottom: 8 }}>Select Your Fighter</h2>
        <p className="text-secondary" style={{ marginBottom: 32, fontSize: '0.9rem' }}>
          Choose the character you'll field in battle, then enter the queue.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {roster.map(char => (
            <CharacterCard
              key={char.id}
              character={char}
              isSelected={selectedCharId === char.id}
              onClick={() => setSelectedCharId(prev => prev === char.id ? null : char.id)}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            id="enter-queue-btn"
            className="btn btn-primary btn-lg"
            disabled={!selectedCharId}
            onClick={handleJoinQueue}
          >
            ⚔️ Enter Queue
          </button>
          {!selectedCharId && (
            <span className="text-muted" style={{ alignSelf: 'center', fontSize: '0.85rem' }}>
              Select a character first
            </span>
          )}
        </div>

        {queueError && <p className="form-error" style={{ marginTop: 12 }}>{queueError}</p>}
      </div>
    </div>
  );
};
