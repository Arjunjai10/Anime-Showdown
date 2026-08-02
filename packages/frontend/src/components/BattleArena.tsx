import React, { useState, useEffect, useRef } from 'react';
import type { BattleState, Move, PlayerKey, ChatMessage } from '../types';
import { HPBar } from './HPBar';
import { MoveButton } from './MoveButton';
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
      <span style={{ fontSize: '0.72rem', color: '#AAAAAA', fontWeight: 700, textTransform: 'uppercase', marginRight: 4 }}>
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
            backgroundColor: member.isAlive ? '#FFFFFF' : '#333333',
            border: i === (isYou ? you.activeIdx : opponent.activeIdx) ? '2px solid #FFF' : '1px solid #000',
            boxShadow: member.isAlive ? '0 0 6px rgba(255,255,255,0.5)' : 'none',
            display: 'inline-block',
            opacity: member.isAlive ? 1 : 0.4,
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

      {/* ── Cinematic Monocrom Widescreen Stage ───────────────────────── */}
      <div
        style={{
          gridArea: 'battle-stage',
          minHeight: 280,
          padding: '24px 40px',
          background: '#050505',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Ambient Monochrome Stage Lighting */}
        <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1, background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)', zIndex: 0 }} />

        {/* Opponent Sprite */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <FighterSprite id={opponent.characterId} size="battle" flip={true} />
          <span style={{ marginTop: 10, fontWeight: 800, fontSize: '1.05rem', color: '#FFF', letterSpacing: '0.02em' }}>
            {opponent.name}
          </span>
          {opponent.username && <span style={{ fontSize: '0.75rem', color: '#AAAAAA' }}>{opponent.username}</span>}
        </div>

        {/* Center VS Indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.12em', lineHeight: 1, textShadow: '0 2px 10px rgba(255,255,255,0.3)' }}>
            VS
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFF', background: '#181818', padding: '3px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            TURN {battleState.turn}
          </span>
          {battleState.format && (
            <span style={{ fontSize: '0.68rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {battleState.format.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Player Sprite */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <FighterSprite id={you.characterId} size="battle" flip={false} />
          <span style={{ marginTop: 10, fontWeight: 800, fontSize: '1.05rem', color: '#FFF', letterSpacing: '0.02em' }}>
            {you.name} <span style={{ color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 900, textDecoration: 'underline' }}>(YOU)</span>
          </span>
          {you.username && <span style={{ fontSize: '0.75rem', color: '#AAAAAA' }}>{you.username}</span>}
        </div>
      </div>

      {/* ── Your Info Bar ─────────────────────────────────────────────── */}
      <div style={{ gridArea: 'player-a-info', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {renderTeamBeads(you.team, true)}
        <HPBar fighter={you} />
      </div>

      {/* ── Combat Action Dashboard (Monochrome) ──────────────────────── */}
      <div style={{ gridArea: 'moves', display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        {/* Forced Switch KO Replacement */}
        {battleState.phase === 'switching' && you.mustSwitch ? (
          <div style={{ padding: 16, background: '#141414', border: '1px solid #FFFFFF', borderRadius: 8, boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFF', fontWeight: 800, fontSize: '0.95rem', marginBottom: 12, textTransform: 'uppercase' }}>
              <span>⚠️ {you.name} has fallen in combat. Select a surviving teammate to deploy:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {benchedTeammates.map((bench) => (
                <button
                  key={bench.idx}
                  onClick={() => handleSwitchSelect(bench.idx)}
                  disabled={isWaiting}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: '#1F1F1F', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 6, cursor: 'pointer', color: '#FFF', textAlign: 'left' }}
                >
                  <FighterSprite id={bench.characterId} size="sm" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>{bench.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#CCCCCC', fontWeight: 700 }}>HP: {bench.currentHp}/{bench.maxHp}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Move Commands */}
            <div style={{ padding: 16, background: '#090909', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{isWaiting ? <strong style={{ color: '#FFF', textDecoration: 'underline' }}>Waiting for opponent...</strong> : battleState.phase === 'ended' ? 'Battle Complete' : 'Select Attack Command'}</span>
                {isWaiting && <div className="queue-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: '#FFF', borderTopColor: 'transparent' }} />}
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
              <div style={{ padding: 14, background: '#070707', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 8 }}>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 8 }}>
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
                        style={{ padding: '6px 12px', background: isSel ? '#FFFFFF' : '#161616', border: isSel ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: isSel ? '#000' : '#FFF' }}
                      >
                        <FighterSprite id={bench.characterId} size="sm" active={isSel} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isSel ? '#000000' : '#FFF' }}>{bench.name}</div>
                          <div style={{ fontSize: '0.7rem', color: isSel ? '#222222' : '#CCCCCC', fontWeight: 700 }}>HP: {Math.round((bench.currentHp / bench.maxHp) * 100)}%</div>
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

      {/* ── Combat Log & Chat Panel (Monochrome) ──────────────────────── */}
      <div
        style={{
          gridArea: 'battle-log',
          background: '#090909',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 380,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', background: '#141414', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <button
            style={{ flex: 1, padding: '10px', fontSize: '0.82rem', fontWeight: 800, background: 'none', border: 'none', borderBottom: activeTab === 'log' ? '2px solid #FFFFFF' : 'none', color: activeTab === 'log' ? '#FFF' : '#777777', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}
            onClick={() => setActiveTab('log')}
          >
            Combat Log ({battleState.log.length})
          </button>
          <button
            style={{ flex: 1, padding: '10px', fontSize: '0.82rem', fontWeight: 800, background: 'none', border: 'none', borderBottom: activeTab === 'chat' ? '2px solid #FFFFFF' : 'none', color: activeTab === 'chat' ? '#FFF' : '#777777', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}
            onClick={() => setActiveTab('chat')}
          >
            Live Chat ({chatMessages.length})
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
          {activeTab === 'log' ? (
            battleState.log.slice(-40).map((entry, i) => (
              <div key={i} style={{ padding: '4px 8px', borderLeft: '2px solid #FFFFFF', background: 'rgba(255,255,255,0.02)', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 800, color: '#FFF', marginRight: 6, textTransform: 'uppercase' }}>{entry.actorName}</span>
                <span style={{ color: '#CCCCCC' }}>{entry.action}</span>
                {entry.damage ? <strong style={{ color: '#FFFFFF', marginLeft: 6, background: '#222222', padding: '1px 6px', borderRadius: 4 }}>−{entry.damage} HP</strong> : null}
                {entry.isCrit ? <strong style={{ color: '#FFFFFF', marginLeft: 6, textDecoration: 'underline', fontWeight: 900 }}>CRIT!</strong> : null}
              </div>
            ))
          ) : (
            chatMessages.length === 0 ? (
              <div style={{ margin: 'auto', color: '#777777', textAlign: 'center' }}>No chat messages yet in this duel.</div>
            ) : (
              chatMessages.map((msg, i) => {
                const isMe = msg.sender === you.username;
                return (
                  <div key={i} style={{ padding: '6px 10px', background: isMe ? '#222222' : '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <span style={{ fontWeight: 800, color: isMe ? '#FFFFFF' : '#CCCCCC', marginRight: 6 }}>{msg.sender}:</span>
                    <span style={{ color: '#FFFFFF' }}>{msg.text}</span>
                  </div>
                );
              })
            )
          )}
          <div ref={activeTab === 'log' ? logEndRef : chatEndRef} />
        </div>

        {activeTab === 'chat' && (
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: 8, padding: '8px 12px', background: '#141414', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <input
              type="text"
              className="input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Message opponent..."
              style={{ flex: 1, height: 32, fontSize: '0.82rem', padding: '0 10px', background: '#030303', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)' }}
            />
            <button type="submit" style={{ height: 32, padding: '0 16px', background: '#FFFFFF', border: 'none', color: '#000000', borderRadius: 6, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase' }}>Send</button>
          </form>
        )}
      </div>

    </div>
  );
};
