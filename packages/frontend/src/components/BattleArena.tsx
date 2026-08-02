import React, { useState, useEffect, useRef } from 'react';
import type { BattleState, Move, PlayerKey, ChatMessage } from '../types';
import { HPBar } from './HPBar';
import { MoveButton } from './MoveButton';
import { FighterLogo } from './FighterLogo';
import { FighterSprite } from './FighterSprite';

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

  const youColor = CHAR_COLORS[you.characterId] ?? { primary: '#6C63FF', secondary: '#818CF8' };
  const oppColor = CHAR_COLORS[opponent.characterId] ?? { primary: '#FF6B6B', secondary: '#FCA5A5' };

  const renderTeamBeads = (team: typeof you.team, isYou: boolean) => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center', justifyContent: isYou ? 'flex-start' : 'flex-end' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginRight: 4 }}>
        {isYou ? 'Your Squad:' : 'Opponent Roster:'}
      </span>
      {(team || []).map((member, i) => (
        <span
          key={i}
          title={`${member.name} (${member.currentHp}/${member.maxHp} HP)${i === (isYou ? you.activeIdx : opponent.activeIdx) ? ' [ACTIVE]' : ''}`}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: member.isAlive ? '#34D399' : '#EF4444',
            border: i === (isYou ? you.activeIdx : opponent.activeIdx) ? '2px solid #FFF' : '1px solid rgba(0,0,0,0.5)',
            display: 'inline-block',
            boxShadow: member.isAlive ? '0 0 8px rgba(52, 211, 153, 0.6)' : 'none',
            opacity: member.isAlive ? 1 : 0.35,
            transition: 'all 0.2s',
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="battle-arena" style={{ gap: 20 }}>

      {/* ── Opponent Info Bar (Top Right) ─────────────────────────────── */}
      <div style={{ gridArea: 'player-b-info', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {renderTeamBeads(opponent.team, false)}
        <HPBar fighter={opponent} flip />
      </div>

      {/* ── Battle Stage ──────────────────────────────────────────────── */}
      <div
        className="glass battle-stage"
        style={{
          minHeight: 320,
          padding: '24px 32px',
          background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.6) 0%, rgba(10, 14, 23, 0.95) 85%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 0 30px rgba(15, 23, 42, 0.9)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        {/* Opponent Fighter Stance (Left Side / Facing Right or opposite) */}
        <div className="fighter-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <div style={{ position: 'relative' }}>
            <FighterSprite id={opponent.characterId} size="battle" flip={true} />
            <div
              style={{
                width: 140,
                height: 16,
                background: `radial-gradient(ellipse at center, ${oppColor.primary}88 0%, transparent 75%)`,
                borderRadius: '50%',
                margin: '8px auto 0',
                filter: 'blur(3px)',
              }}
            />
          </div>
          <div className="fighter-name-tag" style={{ color: oppColor.secondary, marginTop: 8, fontWeight: 900, fontSize: '1.15rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {opponent.name}
          </div>
          {opponent.username && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Player: {opponent.username}</span>}
        </div>

        {/* VS Centerpiece */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 2 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.4rem',
              fontWeight: 900,
              color: 'var(--accent, #38BDF8)',
              letterSpacing: '0.15em',
              textShadow: '0 0 20px rgba(56, 189, 248, 0.6)',
              lineHeight: 1,
            }}
          >
            VS
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC', background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--glass-border)' }}>
            TURN {battleState.turn}
          </span>
          {battleState.format && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {battleState.format.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Your Fighter Stance (Right Side) */}
        <div className="fighter-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <div style={{ position: 'relative' }}>
            <FighterSprite id={you.characterId} size="battle" flip={false} />
            <div
              style={{
                width: 140,
                height: 16,
                background: `radial-gradient(ellipse at center, ${youColor.primary}88 0%, transparent 75%)`,
                borderRadius: '50%',
                margin: '8px auto 0',
                filter: 'blur(3px)',
              }}
            />
          </div>
          <div className="fighter-name-tag" style={{ color: youColor.secondary, marginTop: 8, fontWeight: 900, fontSize: '1.15rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {you.name} <span style={{ color: '#34D399', fontSize: '0.9rem' }}>(YOU)</span>
          </div>
          {you.username && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Commander: {you.username}</span>}
        </div>

        {/* Battlefield ambient lines */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, var(--accent), transparent)', opacity: 0.3 }} />
      </div>

      {/* ── Your Info Bar (Bottom Left) ───────────────────────────────── */}
      <div style={{ gridArea: 'player-a-info', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {renderTeamBeads(you.team, true)}
        <HPBar fighter={you} />
      </div>

      {/* ── Move Selection & Switch Dashboard ─────────────────────────── */}
      <div style={{ gridArea: 'moves', display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        {/* KO Replacement Alert */}
        {battleState.phase === 'switching' && you.mustSwitch ? (
          <div className="glass p-5" style={{ borderColor: '#EAB308', background: 'radial-gradient(ellipse at top left, rgba(234, 179, 8, 0.15) 0%, rgba(15, 23, 42, 0.95) 80%)', border: '1px solid #EAB308' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#FDE047', fontWeight: 800, fontSize: '1.1rem', marginBottom: 14 }}>
              <FighterLogo id="skull" size={24} color="#EAB308" />
              <span>{you.name} has fallen in battle! Select a benched champion to step up:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {benchedTeammates.map((bench) => (
                <button
                  key={bench.idx}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', textAlign: 'left', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid #EAB308' }}
                  onClick={() => handleSwitchSelect(bench.idx)}
                  disabled={isWaiting}
                >
                  <FighterSprite id={bench.characterId} size="sm" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFF' }}>{bench.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 600 }}>HP: {bench.currentHp}/{bench.maxHp}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Attack Command Moves */}
            <div className="glass p-4" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--glass-border)' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FighterLogo id="swords" size={16} color="var(--accent)" />
                  {isWaiting ? (
                    <span style={{ color: '#F97316' }}>Waiting for opponent's decision...</span>
                  ) : battleState.phase === 'ended' ? (
                    <span>Battle Over</span>
                  ) : (
                    <span>Select Attack Command</span>
                  )}
                </div>
                {isWaiting && <div className="queue-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              </div>
              
              <div className="moves-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
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

            {/* Switch Teammate Roster */}
            {benchedTeammates.length > 0 && battleState.phase !== 'ended' && (
              <div className="glass p-4" style={{ background: 'rgba(15, 23, 42, 0.5)', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FighterLogo id="shield" size={16} color="#34D399" />
                  <span>Tactical Switch (Overrides & Executes Before Attacks)</span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {benchedTeammates.map((bench) => {
                    const isSel = selectedAction === `switch:${bench.idx}`;
                    return (
                      <button
                        key={bench.idx}
                        className={`btn ${isSel ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10, border: isSel ? '2px solid #38BDF8' : '1px solid var(--glass-border)' }}
                        onClick={() => handleSwitchSelect(bench.idx)}
                        disabled={isWaiting || battleState.phase === 'switching'}
                      >
                        <FighterSprite id={bench.characterId} size="sm" />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 800, color: isSel ? '#FFF' : 'var(--text-primary)' }}>{bench.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#34D399' }}>HP: {Math.round((bench.currentHp / bench.maxHp) * 100)}%</div>
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

      {/* ── Battle Log & Live Chat Panel (Right Column) ────────────────── */}
      <div className="glass battle-log-panel" style={{ gridArea: 'battle-log', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 420, border: '1px solid var(--glass-border)', background: 'rgba(10, 14, 23, 0.8)' }}>
        
        {/* Tab switchers */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)' }}>
          <button
            className="inline-text-btn"
            style={{ flex: 1, padding: '12px', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center', color: activeTab === 'log' ? 'var(--accent)' : 'var(--text-secondary)', borderBottom: activeTab === 'log' ? '2px solid var(--accent)' : 'none', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('log')}
          >
            Combat Log ({battleState.log.length})
          </button>
          <button
            className="inline-text-btn"
            style={{ flex: 1, padding: '12px', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center', color: activeTab === 'chat' ? 'var(--accent)' : 'var(--text-secondary)', borderBottom: activeTab === 'chat' ? '2px solid var(--accent)' : 'none', transition: 'all 0.2s' }}
            onClick={() => setActiveTab('chat')}
          >
            Live Chat ({chatMessages.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'log' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {battleState.log.slice(-40).map((entry, i) => (
                <div key={i} className="battle-log-entry" style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: '0.85rem', borderLeft: '3px solid var(--accent)' }}>
                  <span className="actor-name" style={{ fontWeight: 800, color: 'var(--accent)', marginRight: 6 }}>{entry.actorName}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{entry.action}</span>
                  {entry.damage ? (
                    <span className="damage-num" style={{ color: '#EF4444', fontWeight: 800, marginLeft: 6 }}>−{entry.damage} HP</span>
                  ) : null}
                  {entry.isCrit ? (
                    <span className="crit-label" style={{ color: '#FDE047', fontWeight: 900, marginLeft: 6 }}>CRIT!</span>
                  ) : null}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chatMessages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', padding: 20, opacity: 0.6 }}>
                  <FighterLogo id="fire" size={36} color="currentColor" />
                  <p style={{ fontSize: '0.85rem', marginTop: 10 }}>No messages yet in this battle. Wish your opponent good luck!</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = msg.sender === you.username;
                  return (
                    <div key={i} style={{ fontSize: '0.88rem', padding: '6px 10px', background: isMe ? 'rgba(56, 189, 248, 0.08)' : 'rgba(249, 115, 22, 0.08)', borderRadius: 8, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      <span style={{ fontWeight: 800, color: isMe ? 'var(--accent)' : '#F97316', marginRight: 6 }}>{msg.sender}: </span>
                      <span style={{ color: 'var(--text-primary)' }}>{msg.text}</span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Chat input box */}
        {activeTab === 'chat' && (
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.4)' }}>
            <input
              type="text"
              className="input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message..."
              maxLength={150}
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', height: 38 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', fontSize: '0.85rem', height: 38, fontWeight: 700 }}>Send</button>
          </form>
        )}

      </div>
    </div>
  );
};
