import React, { useState, useEffect, useRef } from 'react';
import type { BattleState, Move, PlayerKey } from '../types';
import { HPBar } from './HPBar';
import { MoveButton } from './MoveButton';

const ARCHETYPE_EMOJI: Record<string, string> = {
  kaze:    '🥷',
  ryuu:    '🔥',
  tsubaki: '🛡️',
  sora:    '⚡',
  ren:     '👊',
  hana:    '🗡️',
  mira:    '🔮',
  gale:    '🌪️',
};

const CHAR_COLORS: Record<string, { primary: string; secondary: string }> = {
  kaze:    { primary: '#4F46E5', secondary: '#818CF8' },
  ryuu:    { primary: '#DC2626', secondary: '#F97316' },
  tsubaki: { primary: '#059669', secondary: '#34D399' },
  sora:    { primary: '#0EA5E9', secondary: '#38BDF8' },
  ren:     { primary: '#D97706', secondary: '#FCD34D' },
  hana:    { primary: '#7C3AED', secondary: '#A78BFA' },
  mira:    { primary: '#BE123C', secondary: '#FB7185' },
  gale:    { primary: '#92400E', secondary: '#F59E0B' },
};

interface BattleArenaProps {
  battleState: BattleState;
  yourKey: PlayerKey;
  movesData: Move[];
  onSelectMove: (moveId: string) => void;
  isWaiting: boolean;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  battleState,
  yourKey,
  movesData,
  onSelectMove,
  isWaiting,
}) => {
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const movesById = new Map(movesData.map(m => [m.id, m]));

  const you = yourKey === 'playerA' ? battleState.playerA : battleState.playerB;
  const opponent = yourKey === 'playerA' ? battleState.playerB : battleState.playerA;

  const yourMoves = you.moveIds.map(id => movesById.get(id)).filter((m): m is Move => !!m);

  // Auto-scroll battle log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleState.log.length]);

  // Reset selection when a new turn starts
  useEffect(() => {
    if (!isWaiting) setSelectedMoveId(null);
  }, [isWaiting, battleState.turn]);

  function handleMoveSelect(moveId: string) {
    if (isWaiting || battleState.phase === 'ended') return;
    setSelectedMoveId(moveId);
    onSelectMove(moveId);
  }

  const youColor = CHAR_COLORS[you.characterId] ?? { primary: '#6C63FF', secondary: '#818CF8' };
  const oppColor = CHAR_COLORS[opponent.characterId] ?? { primary: '#FF6B6B', secondary: '#FCA5A5' };

  return (
    <div className="battle-arena">

      {/* ── Opponent info bar ────────────────────────────────────────────── */}
      <div style={{ gridArea: 'player-b-info', display: 'flex', justifyContent: 'flex-end' }}>
        <HPBar fighter={opponent} flip />
      </div>

      {/* ── Battle stage ────────────────────────────────────────────────── */}
      <div className="glass battle-stage">
        {/* Opponent fighter (far side) */}
        <div className="fighter-display" style={{ alignItems: 'flex-start' }}>
          <div
            className="fighter-sprite"
            style={{
              background: `radial-gradient(circle, ${oppColor.primary}30 0%, transparent 70%)`,
              boxShadow: `0 0 40px ${oppColor.primary}40`,
            }}
          >
            <div className="fighter-sprite-inner">
              {ARCHETYPE_EMOJI[opponent.characterId] ?? '⚔️'}
            </div>
          </div>
          <span className="fighter-name-tag" style={{ color: oppColor.secondary }}>
            {opponent.name}
          </span>
        </div>

        {/* VS divider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontWeight: 900,
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            VS
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Turn {battleState.turn}
          </span>
        </div>

        {/* Your fighter */}
        <div className="fighter-display" style={{ alignItems: 'flex-end' }}>
          <div
            className="fighter-sprite"
            style={{
              background: `radial-gradient(circle, ${youColor.primary}30 0%, transparent 70%)`,
              boxShadow: `0 0 40px ${youColor.primary}40`,
            }}
          >
            <div className="fighter-sprite-inner">
              {ARCHETYPE_EMOJI[you.characterId] ?? '⚔️'}
            </div>
          </div>
          <span className="fighter-name-tag" style={{ color: youColor.secondary }}>
            {you.name} (You)
          </span>
        </div>
      </div>

      {/* ── Your info bar ────────────────────────────────────────────────── */}
      <div style={{ gridArea: 'player-a-info' }}>
        <HPBar fighter={you} />
      </div>

      {/* ── Move selection ───────────────────────────────────────────────── */}
      <div style={{ gridArea: 'moves', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {isWaiting ? '⏳ Waiting for opponent…' : battleState.phase === 'ended' ? 'Battle over' : 'Choose your move'}
        </div>
        <div className="moves-panel">
          {yourMoves.map(move => (
            <MoveButton
              key={move.id}
              move={move}
              currentEnergy={you.currentEnergy}
              isSelected={selectedMoveId === move.id}
              isDisabled={isWaiting || battleState.phase === 'ended'}
              onClick={() => handleMoveSelect(move.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Battle log ──────────────────────────────────────────────────── */}
      <div className="glass battle-log-panel p-4" style={{ gridArea: 'battle-log' }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          Battle Log
        </div>
        {battleState.log.slice(-30).map((entry, i) => (
          <div key={i} className="battle-log-entry">
            <span className="actor-name">{entry.actorName}</span>
            {' '}
            <span>{entry.action}</span>
            {entry.damage && (
              <span className="damage-num"> −{entry.damage}</span>
            )}
            {entry.isCrit && (
              <span className="crit-label"> CRIT!</span>
            )}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
