import React, { useState, useEffect, useRef } from 'react';
import type { BattleState, Move, PlayerKey, ChatMessage } from '../types';
import { HPBar } from './HPBar';
import { MoveButton } from './MoveButton';
import { FighterLogo } from './FighterLogo';
import { FighterSprite } from './FighterSprite';

interface BattleArenaProps {
  battleId?: string;
  battleState: BattleState;
  yourKey: PlayerKey;
  movesData: Move[];
  onSelectMove: (payload: string | { type: 'move' | 'switch'; moveId?: string; switchIndex?: number }) => void;
  isWaiting: boolean;
  onSendChat?: (text: string) => void;
  chatMessages?: ChatMessage[];
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  battleState,
  yourKey,
  movesData,
  onSelectMove,
  isWaiting,
  onSendChat,
  chatMessages = [],
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'log' | 'chat'>('log');

  const logEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const movesById = new Map(movesData.map(m => [m.id, m]));

  const you = yourKey === 'playerA' ? battleState.playerA : battleState.playerB;
  const opponent = yourKey === 'playerA' ? battleState.playerB : battleState.playerA;

  const yourMoves = (you.moveIds || []).map(id => movesById.get(id)).filter((m): m is Move => !!m);
  const benchedTeammates = (you.team || []).map((t, idx) => ({ ...t, idx })).filter(t => t.idx !== you.activeIdx && t.isAlive);

  useEffect(() => {
    if (activeTab === 'log') logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (activeTab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleState.log.length, chatMessages.length, activeTab]);

  useEffect(() => {
    if (!isWaiting) setSelectedAction(null);
  }, [isWaiting, battleState.turn]);

  function handleMoveSelect(moveId: string) {
    if (isWaiting || battleState.phase === 'ended') return;
    setSelectedAction(`move:${moveId}`);
    onSelectMove({ type: 'move', moveId });
  }

  function handleSwitchSelect(switchIndex: number) {
    if (isWaiting || battleState.phase === 'ended') return;
    setSelectedAction(`switch:${switchIndex}`);
    onSelectMove({ type: 'switch', switchIndex });
  }

  function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !onSendChat) return;
    onSendChat(chatInput);
    setChatInput('');
  }

  const renderTeamBeads = (team: typeof you.team, isYou: boolean) => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center', justifyContent: isYou ? 'flex-start' : 'flex-end' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginRight: 4 }}>
        {isYou ? 'Your Squad:' : 'Opponent Squad:'}
      </span>
      {(team || []).map((member, i) => (
        <span
          key={i}
          title={`${member.name} (${member.currentHp}/${member.maxHp} HP)${i === (isYou ? you.activeIdx : opponent.activeIdx) ? ' [ACTIVE]' : ''}`}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: member.isAlive ? '#10B981' : '#EF4444',
            border: i === (isYou ? you.activeIdx : opponent.activeIdx) ? '2px solid #FFF' : '1px solid rgba(0,0,0,0.4)',
            display: 'inline-block',
            opacity: member.isAlive ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="battle-arena" style={{ gap: 20, padding: '20px', maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Opponent Info Bar ─────────────────────────────────────────── */}
      <div style={{ gridArea: 'player-b-info', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {renderTeamBeads(opponent.team, false)}
        <HPBar fighter={opponent} flip />
      </div>

      {/* ── Cinematic Widescreen Stage ────────────────────────────────── */}
      <div
        style={{
          gridArea: 'battle-stage',
          minHeight: 280,
          padding: '24px 40px',
          background: '#090D15',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Ambient Stage Lighting */}
        <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1, background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', zIndex: 0 }} />

        {/* Opponent Sprite (Left Side, facing Right) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <FighterSprite id={opponent.characterId} size="battle" flip={true} />
          <span style={{ marginTop: 10, fontWeight: 800, fontSize: '1.05rem', color: '#FFF', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {opponent.name}
          </span>
          {opponent.username && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{opponent.username}</span>}
        </div>

        {/* Center VS Indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent, #6366F1)', letterSpacing: '0.1em', lineHeight: 1 }}>
            VS
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.06)', padding: '3px 10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            TURN {battleState.turn}
          </span>
          {battleState.format && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {battleState.format.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Player Sprite (Right Side, facing Left) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <FighterSprite id={you.characterId} size="battle" flip={false} />
          <span style={{ marginTop: 10, fontWeight: 800, fontSize: '1.05rem', color: '#FFF', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {you.name} <span style={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 700 }}>(YOU)</span>
          </span>
          {you.username && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{you.username}</span>}
        </div>
      </div>

      {/* ── Your Info Bar ─────────────────────────────────────────────── */}
      <div style={{ gridArea: 'player-a-info', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {renderTeamBeads(you.team, true)}
        <HPBar fighter={you} />
      </div>

      {/* ── Combat Action Dashboard ───────────────────────────────────── */}
      <div style={{ gridArea: 'moves', display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        {/* Forced Switch KO Replacement */}
        {battleState.phase === 'switching' && you.mustSwitch ? (
          <div style={{ padding: 16, background: '#171413', border: '1px solid #F59E0B', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FCD34D', fontWeight: 700, fontSize: '0.95rem', marginBottom: 12 }}>
              <span>⚠️ {you.name} has fallen in combat. Select a surviving teammate to deploy:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {benchedTeammates.map((bench) => (
                <button
                  key={bench.idx}
                  onClick={() => handleSwitchSelect(bench.idx)}
                  disabled={isWaiting}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: '#1E2332', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, cursor: 'pointer', color: '#FFF', textAlign: 'left' }}
                >
                  <FighterSprite id={bench.characterId} size="sm" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{bench.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10B981' }}>HP: {bench.currentHp}/{bench.maxHp}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Move Commands */}
            <div style={{ padding: 16, background: '#0E131E', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{isWaiting ? <strong style={{ color: '#F59E0B' }}>Waiting for opponent...</strong> : battleState.phase === 'ended' ? 'Battle Complete' : 'Select Attack Command'}</span>
                {isWaiting && <div className="queue-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {yourMoves.map(move => (
                  <MoveButton
                    key={move.id}
                    move={move}
                    currentEnergy={you.currentEnergy}
                    isSelected={selectedAction === `move:${move.id}`}
                    isDisabled={isWaiting || battleState.phase === 'ended' || battleState.phase === 'switching'}
                    onClick={() => handleMoveSelect(move.id)}
                  />
                ))}
              </div>
            </div>

            {/* Tactical Switch Bench */}
            {benchedTeammates.length > 0 && battleState.phase !== 'ended' && (
              <div style={{ padding: 14, background: '#0D111A', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 10 }}>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Switch Active Fighter (Higher Priority Than Attacks)
                </span>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {benchedTeammates.map((bench) => {
                    const isSel = selectedAction === `switch:${bench.idx}`;
                    return (
                      <button
                        key={bench.idx}
                        onClick={() => handleSwitchSelect(bench.idx)}
                        disabled={isWaiting || battleState.phase === 'switching'}
                        style={{ padding: '6px 12px', background: isSel ? '#38BDF8' : '#131A28', border: isSel ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#FFF' }}
                      >
                        <FighterSprite id={bench.characterId} size="sm" />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isSel ? '#0B0F19' : '#FFF' }}>{bench.name}</div>
                          <div style={{ fontSize: '0.7rem', color: isSel ? '#0B0F19' : '#10B981', fontWeight: 600 }}>HP: {Math.round((bench.currentHp / bench.maxHp) * 100)}%</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Combat Log & Chat Panel ───────────────────────────────────── */}
      <div
        style={{
          gridArea: 'battle-log',
          background: '#0E131E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 380,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', background: '#131926', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            style={{ flex: 1, padding: '10px', fontSize: '0.82rem', fontWeight: 700, background: 'none', border: 'none', borderBottom: activeTab === 'log' ? '2px solid var(--accent)' : 'none', color: activeTab === 'log' ? '#FFF' : 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => setActiveTab('log')}
          >
            Combat Log ({battleState.log.length})
          </button>
          <button
            style={{ flex: 1, padding: '10px', fontSize: '0.82rem', fontWeight: 700, background: 'none', border: 'none', borderBottom: activeTab === 'chat' ? '2px solid var(--accent)' : 'none', color: activeTab === 'chat' ? '#FFF' : 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => setActiveTab('chat')}
          >
            Live Chat ({chatMessages.length})
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
          {activeTab === 'log' ? (
            battleState.log.slice(-40).map((entry, i) => (
              <div key={i} style={{ padding: '4px 6px', borderLeft: '2px solid var(--accent)', background: 'rgba(255,255,255,0.01)', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>{entry.actorName}</span>
                <span style={{ color: 'var(--text-primary)' }}>{entry.action}</span>
                {entry.damage ? <strong style={{ color: '#F87171', marginLeft: 6 }}>−{entry.damage} HP</strong> : null}
                {entry.isCrit ? <strong style={{ color: '#F59E0B', marginLeft: 6 }}>CRIT!</strong> : null}
              </div>
            ))
          ) : (
            chatMessages.length === 0 ? (
              <div style={{ margin: 'auto', color: 'var(--text-muted)', textAlign: 'center' }}>No chat messages yet in this duel.</div>
            ) : (
              chatMessages.map((msg, i) => {
                const isMe = msg.sender === you.username;
                return (
                  <div key={i} style={{ padding: '6px 10px', background: isMe ? '#1E293B' : '#171D2D', borderRadius: 6, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <span style={{ fontWeight: 700, color: isMe ? '#38BDF8' : '#F59E0B', marginRight: 6 }}>{msg.sender}:</span>
                    <span>{msg.text}</span>
                  </div>
                );
              })
            )
          )}
          <div ref={activeTab === 'log' ? logEndRef : chatEndRef} />
        </div>

        {activeTab === 'chat' && (
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: 8, padding: '8px 12px', background: '#131926', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <input
              type="text"
              className="input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message opponent..."
              style={{ flex: 1, height: 32, fontSize: '0.82rem', padding: '0 10px', background: '#090D14' }}
            />
            <button type="submit" style={{ height: 32, padding: '0 14px', background: '#232C40', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Send</button>
          </form>
        )}
      </div>

    </div>
  );
};
