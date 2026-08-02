import React, { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import type { BattleState, Move, PlayerKey, BattleFighterState, ActiveStatusEffect, ChatMessage } from '../types';
import { FighterSprite } from './FighterSprite';
import { FighterLogo } from './FighterLogo';

interface BattleArenaProps {
  battleId?: string;
  battleState: BattleState;
  yourKey: PlayerKey;
  movesData: Move[];
  isWaiting: boolean;
  onSelectMove?: (payload: string | { type: 'move' | 'switch'; moveId?: string; switchIndex?: number }) => void;
  onSendChat?: (text: string) => void;
  chatMessages?: ChatMessage[];
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  battleState,
  yourKey,
  movesData,
  isWaiting,
  onSelectMove,
  onSendChat,
  chatMessages = [],
}) => {
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  
  const { autoScrollLog } = useSettingsStore();
  const logEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const myState = battleState[yourKey];
  const oppKey: PlayerKey = yourKey === 'playerA' ? 'playerB' : 'playerA';
  const opponentState = battleState[oppKey];

  const myActiveFighter: BattleFighterState = (myState.team && myState.team[myState.activeIdx ?? 0]) || myState;
  const oppActiveFighter: BattleFighterState = (opponentState.team && opponentState.team[opponentState.activeIdx ?? 0]) || opponentState;

  useEffect(() => {
    if (autoScrollLog) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battleState.log.length, autoScrollLog]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  function handleCommitMove() {
    if (!selectedMoveId || isWaiting || !onSelectMove) return;
    onSelectMove({ type: 'move', moveId: selectedMoveId });
    setSelectedMoveId(null);
  }

  function handleCommitSwitch(index: number) {
    if (isWaiting || !onSelectMove) return;
    onSelectMove({ type: 'switch', switchIndex: index });
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !onSendChat) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  }

  function renderStatusBadges(statuses?: ActiveStatusEffect[]) {
    if (!statuses || statuses.length === 0) return null;
    return (
      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
        {statuses.map((st, idx) => (
          <span
            key={idx}
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: 4,
              textTransform: 'uppercase',
              background: 'var(--panel-header)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {st.type} ({st.turnsRemaining}T)
          </span>
        ))}
      </div>
    );
  }

  function renderTeamBeads(team?: BattleFighterState[], activeIndex = 0) {
    if (!team || team.length === 0) return null;
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        {team.map((m, idx) => {
          const isKo = (m.currentHp ?? 0) <= 0;
          const isAct = idx === activeIndex;
          return (
            <span
              key={idx}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: isKo ? 'var(--text-muted)' : 'var(--text-primary)',
                border: isAct ? '2px solid var(--border-strong)' : '1px solid var(--border)',
                display: 'inline-block',
                boxShadow: !isKo ? '0 0 6px var(--accent-dim)' : 'none',
              }}
              title={`${m.name || m.characterId}: ${m.currentHp}/${m.maxHp} HP`}
            />
          );
        })}
      </div>
    );
  }

  function getHpColor(pct: number) {
    if (pct > 50) return 'var(--hp-high)';
    if (pct > 25) return 'var(--hp-mid)';
    return 'var(--hp-low)';
  }

  return (
    <div className="container" style={{ padding: '20px 24px', maxWidth: 1280, margin: '0 auto' }}>
      
      {/* ── Top Bar: Duelist Roster Bead HUD ────────────────────────── */}
      <div
        style={{
          padding: '10px 18px',
          marginBottom: 16,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {myState.username || 'You (Player A)'}
          </span>
          {renderTeamBeads(myState.team, myState.activeIdx)}
        </div>
        
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 900,
            color: 'var(--text-primary)',
            padding: '4px 14px',
            background: 'var(--panel-header)',
            border: '1px solid var(--border-strong)',
            borderRadius: 16,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Turn {battleState.turn || 1} · {battleState.phase || 'selecting'} Phase
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {renderTeamBeads(opponentState.team, opponentState.activeIdx)}
          <span style={{ fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {opponentState.username || 'Opponent'}
          </span>
        </div>
      </div>

      {/* ── Main Layout: Combat Arena vs Multi-Tab Log & Chat ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Arena Stage & Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Battle Stage */}
          <div
            style={{
              height: 380,
              background: 'var(--stage-bg)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 24,
              boxShadow: 'inset 0 0 40px var(--shadow-color)',
            }}
          >
            <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, var(--border), transparent)', zIndex: 0 }} />

            {/* Opponent HUD & Sprite (Top Right) */}
            {oppActiveFighter ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 20, zIndex: 1 }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', minWidth: 240, boxShadow: '0 4px 15px var(--shadow-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{oppActiveFighter.name || oppActiveFighter.characterId}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Lv. 100</span>
                  </div>
                  <div style={{ width: '100%', height: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(0, ((oppActiveFighter.currentHp ?? 100) / (oppActiveFighter.maxHp || 100)) * 100)}%`, height: '100%', background: getHpColor(((oppActiveFighter.currentHp ?? 100) / (oppActiveFighter.maxHp || 100)) * 100), transition: 'width 0.3s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <span>HP: {oppActiveFighter.currentHp ?? 0} / {oppActiveFighter.maxHp ?? 100}</span>
                    <span>ENG: {oppActiveFighter.currentEnergy ?? 0}%</span>
                  </div>
                  {renderStatusBadges(oppActiveFighter.statusEffects)}
                </div>
                <FighterSprite id={oppActiveFighter.characterId || 'kaze'} size="xl" />
              </div>
            ) : null}

            {/* Player HUD & Sprite (Bottom Left) */}
            {myActiveFighter ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', gap: 20, zIndex: 1 }}>
                <FighterSprite id={myActiveFighter.characterId || 'kaze'} size="xl" flip />
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', minWidth: 240, boxShadow: '0 4px 15px var(--shadow-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{myActiveFighter.name || myActiveFighter.characterId}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Lv. 100</span>
                  </div>
                  <div style={{ width: '100%', height: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${Math.max(0, ((myActiveFighter.currentHp ?? 100) / (myActiveFighter.maxHp || 100)) * 100)}%`, height: '100%', background: getHpColor(((myActiveFighter.currentHp ?? 100) / (myActiveFighter.maxHp || 100)) * 100), transition: 'width 0.3s ease' }} />
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (myActiveFighter.currentEnergy ?? 0))}%`, height: '100%', background: 'var(--energy-color)', transition: 'width 0.3s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <span>HP: {myActiveFighter.currentHp ?? 0} / {myActiveFighter.maxHp ?? 100}</span>
                    <span>ENG: {myActiveFighter.currentEnergy ?? 0}%</span>
                  </div>
                  {renderStatusBadges(myActiveFighter.statusEffects)}
                </div>
              </div>
            ) : null}
          </div>

          {/* Action Control Panel (Pokémon Showdown bottom style) */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 18, minHeight: 180 }}>
            {battleState.phase === 'ended' ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 700, padding: 20 }}>
                This showdown match has concluded. Review battle history or return to lobby.
              </div>
            ) : isWaiting ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, height: 130, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                <div className="queue-spinner" style={{ width: 22, height: 22, borderWidth: 2, borderColor: 'var(--text-primary)', borderTopColor: 'transparent' }} />
                Waiting for opponent to commit their tactical turn...
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Select Tactical Command ({myState.mustSwitch ? '⚠️ Must Switch Active Fighter!' : 'Choose Attack or Switch'})
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
                  
                  {/* Moves Grid */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Equipped Moves</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                      {(myActiveFighter.moveIds || []).map((mid: string) => {
                        const m = movesData.find(move => move.id === mid);
                        const canAfford = (myActiveFighter.currentEnergy ?? 0) >= (m?.energyCost || 0);
                        const disabled = myState.mustSwitch || !canAfford;
                        const isSel = selectedMoveId === mid;
                        return (
                          <button
                            key={mid}
                            onClick={() => setSelectedMoveId(mid)}
                            disabled={disabled}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 6,
                              textAlign: 'left',
                              cursor: disabled ? 'not-allowed' : 'pointer',
                              background: isSel ? 'var(--btn-primary-bg)' : 'var(--panel-bg)',
                              color: isSel ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                              border: isSel ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                              opacity: disabled ? 0.4 : 1,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: '0.88rem' }}>
                              <span>{m ? m.name : mid}</span>
                              {m && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', background: isSel ? 'transparent' : 'var(--panel-header)', border: '1px solid var(--border)' }}>{m.type}</span>}
                            </div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: 4 }}>
                              Cost: {m ? m.energyCost : 0} ENG {m?.power ? `· Pwr: ${m.power}` : ''}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={handleCommitMove}
                      disabled={!selectedMoveId || myState.mustSwitch}
                      className="btn btn-primary"
                      style={{ marginTop: 12, width: '100%', height: 38, fontWeight: 900, textTransform: 'uppercase', opacity: (!selectedMoveId || myState.mustSwitch) ? 0.4 : 1, cursor: (!selectedMoveId || myState.mustSwitch) ? 'not-allowed' : 'pointer' }}
                    >
                      Commit Attack Turn
                    </button>
                  </div>

                  {/* Roster Switch Box */}
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Switch Active Fighter</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                      {(myState.team || []).map((mem: BattleFighterState, idx: number) => {
                        const isAct = idx === myState.activeIdx;
                        const isKo = (mem.currentHp ?? 0) <= 0;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleCommitSwitch(idx)}
                            disabled={isAct || isKo}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 8px',
                              borderRadius: 6,
                              background: isAct ? 'var(--active-bg)' : 'var(--panel-bg)',
                              border: '1px solid var(--border)',
                              cursor: isAct || isKo ? 'not-allowed' : 'pointer',
                              color: 'var(--text-primary)',
                              opacity: isKo ? 0.4 : 1,
                              textAlign: 'left',
                            }}
                          >
                            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                              {mem.name || mem.characterId}
                              {isAct && <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>(Active)</span>}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: isKo ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 700 }}>
                              {isKo ? 'Fainted' : `${mem.currentHp}/${mem.maxHp}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Combat Log & Live Battle Chat */}
        <div style={{ display: 'flex', flexDirection: 'column', height: 580, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          
          {/* Combat Turn Log */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: 'var(--panel-header)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <FighterLogo id="swords" size={16} color="var(--text-primary)" />
              Battle Combat Log
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
              {(!battleState.log || battleState.log.length === 0) ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto', fontSize: '0.82rem' }}>
                  Match started! Select your opening tactical action below.
                </div>
              ) : (
                battleState.log.map((entry, idx) => (
                  <div key={idx} style={{ paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--text-secondary)', marginRight: 6, fontSize: '0.75rem', fontWeight: 700 }}>[T{entry.turn}]</span>
                    <strong>{entry.actorName}</strong> used <strong>{entry.action}</strong>!
                    {entry.damage ? ` Dealt ${entry.damage} DMG!` : ''}
                    {entry.healing ? ` Restored ${entry.healing} HP!` : ''}
                    {entry.isCrit ? ' [CRITICAL HIT!]' : ''}
                    {entry.missed ? ' [MISSED!]' : ''}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Room PVP Chat */}
          <div style={{ height: 210, display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)' }}>
            <div style={{ padding: '8px 14px', background: 'var(--panel-header)', borderBottom: '1px solid var(--border)', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              Room PVP Chat
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
              {chatMessages.length === 0 ? (
                <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No messages yet.</div>
              ) : (
                chatMessages.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, lineHeight: 1.3 }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{m.sender}:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{m.text}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 6, padding: '8px 10px', borderTop: '1px solid var(--border)', background: 'var(--panel-header)' }}>
              <input
                type="text"
                className="input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Chat with opponent..."
                style={{ flex: 1, height: 32, fontSize: '0.8rem', padding: '0 10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              />
              <button type="submit" className="btn btn-primary" style={{ height: 32, padding: '0 12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}>
                Send
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
