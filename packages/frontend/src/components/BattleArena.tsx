import React, { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import type { BattleState, Move, PlayerKey, BattleFighterState, ActiveStatusEffect, ChatMessage, BattleLogEntry } from '../types';
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
  battleId,
  battleState,
  yourKey,
  movesData,
  isWaiting,
  onSelectMove,
  onSendChat,
  chatMessages = [],
}) => {
  const [chatInput, setChatInput] = useState('');
  
  const { autoScrollLog } = useSettingsStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  const myState = battleState[yourKey];
  const oppKey: PlayerKey = yourKey === 'playerA' ? 'playerB' : 'playerA';
  const opponentState = battleState[oppKey];

  const myActiveFighter: BattleFighterState = (myState.team && myState.team[myState.activeIdx ?? 0]) || myState;
  const oppActiveFighter: BattleFighterState = (opponentState.team && opponentState.team[opponentState.activeIdx ?? 0]) || opponentState;

  useEffect(() => {
    if (autoScrollLog) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battleState.log.length, chatMessages.length, autoScrollLog]);

  function handleCommitMove(moveId: string) {
    if (isWaiting || !onSelectMove || myState.mustSwitch) return;
    onSelectMove({ type: 'move', moveId });
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

  function renderTeamBeads(team?: BattleFighterState[], activeIndex = 0) {
    if (!team || team.length === 0) return null;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 16px)', gap: 4, justifyContent: 'center' }}>
        {team.map((m, idx) => {
          const isKo = (m.currentHp ?? 0) <= 0;
          const isAct = idx === activeIndex;
          return (
            <div
              key={idx}
              title={`${m.name || m.characterId}: ${m.currentHp}/${m.maxHp} HP`}
              style={{
                width: 15,
                height: 15,
                borderRadius: '50%',
                background: isKo ? 'var(--text-muted)' : isAct ? 'var(--text-primary)' : 'var(--panel-header)',
                border: '2px solid var(--border-strong)',
                position: 'relative',
                opacity: isKo ? 0.35 : 1,
                boxShadow: isAct ? '0 0 8px var(--text-primary)' : 'none',
              }}
            >
              <div style={{ width: '100%', height: '50%', background: isKo ? 'var(--text-muted)' : 'var(--text-primary)', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }} />
              <div style={{ width: '100%', height: '50%', background: 'var(--card-bg)', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 5, height: 5, borderRadius: '50%', background: 'var(--border-strong)' }} />
            </div>
          );
        })}
      </div>
    );
  }

  function formatRelicName(relicId?: string) {
    if (!relicId) return 'No Relic Equipped';
    return relicId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Combine turn logs into grouped sections with turn headers like Pokémon Showdown
  function renderShowdownLog() {
    const logEntries = battleState.log || [];
    
    // We can group entries by turn number to insert Turn X separator banners
    let currentTurnTracker = 0;
    const renderedElements: React.ReactNode[] = [];

    // Header box
    renderedElements.push(
      <div key="battle-init-info" style={{ padding: '8px 4px', fontSize: '0.82rem', color: 'var(--text-secondary)', borderBottom: '1px dashed var(--border)', marginBottom: 8 }}>
        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Battle started between {myState.username || 'You'} and {opponentState.username || 'Opponent'}!</div>
        <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Format: <strong>[OU] 6v6 Standard Showdown</strong></div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Species Clause: Limit one of each Anime Champion</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>HP Percentage Mod: Opponent HP is shown in percentages</div>
      </div>
    );

    logEntries.forEach((entry: BattleLogEntry, idx: number) => {
      if (entry.turn > currentTurnTracker) {
        currentTurnTracker = entry.turn;
        renderedElements.push(
          <div
            key={`turn-banner-${currentTurnTracker}-${idx}`}
            style={{
              margin: '12px 0 8px',
              padding: '6px 12px',
              background: 'var(--panel-header)',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              fontWeight: 900,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Turn {currentTurnTracker}
          </div>
        );
      }

      renderedElements.push(
        <div key={`log-entry-${idx}`} style={{ padding: '3px 4px', fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
          <span style={{ fontWeight: 800 }}>{entry.actorName}</span> used <strong style={{ textDecoration: 'underline' }}>{entry.action}</strong>!
          {entry.damage && (
            <span style={{ display: 'block', paddingLeft: 12, color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem' }}>
              💥 Dealt <strong>{entry.damage} DMG!</strong>
            </span>
          )}
          {entry.healing && (
            <span style={{ display: 'block', paddingLeft: 12, color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem' }}>
              ✨ Restored <strong>{entry.healing} HP!</strong>
            </span>
          )}
          {entry.isCrit && <span style={{ marginLeft: 6, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '0.75rem', padding: '1px 4px', border: '1px solid var(--text-primary)', borderRadius: 4 }}>Critical Hit!</span>}
          {entry.missed && <span style={{ marginLeft: 6, fontStyle: 'italic', color: 'var(--text-muted)' }}>(But it missed!)</span>}
        </div>
      );
    });

    // Add room chat messages into the stream if any exist
    if (chatMessages.length > 0) {
      renderedElements.push(
        <div key="chat-history-divider" style={{ marginTop: 14, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
          Live PVP Match Chat
        </div>
      );
      chatMessages.forEach((msg, idx) => {
        renderedElements.push(
          <div key={`chat-msg-${idx}`} style={{ padding: '2px 4px', fontSize: '0.82rem', lineHeight: 1.3 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{msg.sender}: </strong>
            <span style={{ color: 'var(--text-secondary)' }}>{msg.text}</span>
          </div>
        );
      });
    }

    return renderedElements;
  }

  const myHpPct = Math.max(0, Math.round(((myActiveFighter.currentHp ?? 100) / (myActiveFighter.maxHp || 100)) * 100));
  const oppHpPct = Math.max(0, Math.round(((oppActiveFighter.currentHp ?? 100) / (oppActiveFighter.maxHp || 100)) * 100));

  return (
    <div className="container" style={{ padding: '16px 20px', maxWidth: 1360, margin: '0 auto' }}>

      {/* ── Main Showdown Split: Left (Stage + Deck) vs Right (Log & Chat) ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Stage & Tactical Action Deck */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* ── 1. THE ARENA STAGE (Authentic Showdown Visual Layout) ──────── */}
          <div
            style={{
              height: 390,
              background: 'var(--stage-bg)',
              border: '2px solid var(--border-strong)',
              borderRadius: 8,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 60px var(--shadow-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Arena Ground Line */}
            <div style={{ position: 'absolute', top: '55%', left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, var(--border-strong), transparent)', zIndex: 0 }} />

            {/* Top-Left: Turn Counter Badge */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                padding: '6px 16px',
                background: 'var(--card-bg)',
                border: '2px solid var(--border-strong)',
                borderRadius: 6,
                fontWeight: 900,
                fontSize: '1.05rem',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 12px var(--shadow-color)',
                zIndex: 10,
              }}
            >
              Turn {battleState.turn || 1}
            </div>

            {/* Top-Right: Opponent Trainer Info & Pokeball Roster Beads */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'var(--card-bg)',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px var(--shadow-color)',
                zIndex: 10,
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 6 }}>
                {opponentState.username || 'Opponent'}
              </span>
              <div style={{ marginBottom: 4 }}>
                <FighterLogo id="helmet" size={32} color="var(--text-secondary)" />
              </div>
              {renderTeamBeads(opponentState.team, opponentState.activeIdx)}
            </div>

            {/* Bottom-Left: Player Trainer Info & Pokeball Roster Beads */}
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'var(--card-bg)',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px var(--shadow-color)',
                zIndex: 10,
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 6 }}>
                {myState.username || 'You'}
              </span>
              <div style={{ marginBottom: 4 }}>
                <FighterLogo id="fire" size={32} color="var(--text-primary)" />
              </div>
              {renderTeamBeads(myState.team, myState.activeIdx)}
            </div>

            {/* Opponent Fighter & Showdown HP Bar (Upper Right Arena) */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '30px 140px 0 0', gap: 24, zIndex: 5 }}>
              
              {/* Showdown-Style Floating HP Capsule */}
              <div style={{ background: 'var(--card-bg)', border: '2px solid var(--border-strong)', borderRadius: 8, padding: '8px 14px', width: 250, boxShadow: '0 6px 20px var(--shadow-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                    {oppActiveFighter?.name || oppActiveFighter?.characterId} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>♂ L100</span>
                  </span>
                  <span style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{oppHpPct}%</span>
                </div>
                <div style={{ width: '100%', height: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border-strong)', borderRadius: 6, overflow: 'hidden', padding: 1 }}>
                  <div style={{ width: `${oppHpPct}%`, height: '100%', background: oppHpPct > 50 ? 'var(--text-primary)' : oppHpPct > 20 ? 'var(--text-secondary)' : 'var(--text-muted)', borderRadius: 4, transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  <span>Status: {oppActiveFighter.statusEffects && oppActiveFighter.statusEffects.length > 0 ? oppActiveFighter.statusEffects[0].type : 'Normal'}</span>
                  <span>ENG: {oppActiveFighter?.currentEnergy ?? 0}%</span>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <FighterSprite id={oppActiveFighter?.characterId || 'kaze'} size="xl" />
              </div>
            </div>

            {/* Player Fighter & Showdown HP Bar (Lower Left Arena) */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', padding: '0 0 30px 140px', gap: 24, zIndex: 5 }}>
              <div style={{ marginBottom: 10 }}>
                <FighterSprite id={myActiveFighter?.characterId || 'kaze'} size="xl" flip />
              </div>

              {/* Showdown-Style Floating HP Capsule */}
              <div style={{ background: 'var(--card-bg)', border: '2px solid var(--border-strong)', borderRadius: 8, padding: '8px 14px', width: 270, boxShadow: '0 6px 20px var(--shadow-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                    {myActiveFighter?.name || myActiveFighter?.characterId} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>♂ L100</span>
                  </span>
                  <span style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{myHpPct}%</span>
                </div>
                
                {/* HP Meter */}
                <div style={{ width: '100%', height: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border-strong)', borderRadius: 6, overflow: 'hidden', padding: 1, marginBottom: 4 }}>
                  <div style={{ width: `${myHpPct}%`, height: '100%', background: myHpPct > 50 ? 'var(--text-primary)' : myHpPct > 20 ? 'var(--text-secondary)' : 'var(--text-muted)', borderRadius: 4, transition: 'width 0.3s ease' }} />
                </div>

                {/* Energy / PP Meter */}
                <div style={{ width: '100%', height: 5, background: 'var(--bg-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, myActiveFighter?.currentEnergy ?? 0)}%`, height: '100%', background: 'var(--text-secondary)', transition: 'width 0.3s ease' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  <span>HP {myActiveFighter?.currentHp ?? 0} / {myActiveFighter?.maxHp ?? 100}</span>
                  <span>ENG {myActiveFighter?.currentEnergy ?? 0}%</span>
                </div>
              </div>
            </div>

          </div>

          {/* ── 2. THE TACTICAL CONTROL DECK (Pokémon Showdown Bottom Deck) ───── */}
          <div style={{ background: 'var(--card-bg)', border: '2px solid var(--border-strong)', borderRadius: 8, padding: '14px 18px', minHeight: 250 }}>
            
            {battleState.phase === 'ended' ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800 }}>
                This showdown match has officially concluded. Review the battle history on the right.
              </div>
            ) : isWaiting ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, height: 190, color: 'var(--text-primary)' }}>
                <div className="queue-spinner" style={{ width: 28, height: 28, borderWidth: 3, borderColor: 'var(--text-primary)', borderTopColor: 'transparent' }} />
                <span style={{ fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Waiting for opponent...</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>You have committed your tactical decision for this turn.</span>
              </div>
            ) : (
              <div>
                
                {/* Header Banner: What will Fighter do? */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>What will</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {myActiveFighter?.name || myActiveFighter?.characterId}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>do?</span>
                    <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: 'var(--panel-header)', border: '1px solid var(--border)', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      HP {myActiveFighter?.currentHp ?? 0}/{myActiveFighter?.maxHp ?? 100}
                    </span>
                  </div>
                  <div>
                    <button className="btn btn-ghost" style={{ height: 30, padding: '0 12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', borderColor: 'var(--border)' }}>
                      ⏳ Timer & Options
                    </button>
                  </div>
                </div>

                {/* Section 1: ATTACK COMMANDS */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--text-primary)' }}>■ Attack</span>
                    {myState.mustSwitch && <span style={{ color: '#EF4444', fontSize: '0.78rem', textTransform: 'none' }}>(Disabled — You must switch in a replacement fighter!)</span>}
                  </div>

                  {/* 4-Column Move Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {(myActiveFighter?.moveIds || []).map((mid: string) => {
                      const m = movesData.find(move => move.id === mid);
                      const canAfford = (myActiveFighter?.currentEnergy ?? 0) >= (m?.energyCost || 0);
                      const disabled = myState.mustSwitch || !canAfford;
                      return (
                        <button
                          key={mid}
                          onClick={() => handleCommitMove(mid)}
                          disabled={disabled}
                          style={{
                            height: 70,
                            padding: '10px 12px',
                            borderRadius: 6,
                            background: 'var(--panel-bg)',
                            border: '2px solid var(--border)',
                            color: 'var(--text-primary)',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.4 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                            boxShadow: !disabled ? '0 2px 6px var(--shadow-color)' : 'none',
                          }}
                          onMouseOver={(e) => {
                            if (!disabled) e.currentTarget.style.borderColor = 'var(--border-strong)';
                          }}
                          onMouseOut={(e) => {
                            if (!disabled) e.currentTarget.style.borderColor = 'var(--border)';
                          }}
                        >
                          <div style={{ fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m ? m.name : mid}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.72rem', fontWeight: 800 }}>
                            <span style={{ textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                              {m?.type || 'Attack'}
                            </span>
                            <span style={{ background: 'var(--panel-header)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                              {m?.energyCost || 0} ENG
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Terastallize / Relic Option Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel-header)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', marginBottom: 16, fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)', marginRight: 8, textTransform: 'uppercase' }}>🛡️ Equipped Relic:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{formatRelicName(myActiveFighter?.relicId)}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-primary)', padding: '2px 8px', border: '1px solid var(--border-strong)', borderRadius: 4, textTransform: 'uppercase' }}>
                    {myActiveFighter?.relicUsed ? 'Triggered' : 'Active Passively'}
                  </span>
                </div>

                {/* Section 2: SWITCH COMMANDS */}
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    ■ Switch
                  </div>

                  {/* 6-Column Roster Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                    {(myState.team || []).map((mem: BattleFighterState, idx: number) => {
                      const isAct = idx === myState.activeIdx;
                      const isKo = (mem.currentHp ?? 0) <= 0;
                      const hpPercent = Math.max(0, Math.round(((mem.currentHp ?? 100) / (mem.maxHp || 100)) * 100));
                      const disabled = isAct || isKo;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleCommitSwitch(idx)}
                          disabled={disabled}
                          style={{
                            padding: '8px 6px',
                            borderRadius: 6,
                            background: isAct ? 'var(--panel-header)' : 'var(--panel-bg)',
                            border: isAct ? '2px solid var(--border-strong)' : '1px solid var(--border)',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: isKo ? 0.35 : isAct ? 0.7 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ marginBottom: 4 }}>
                            <FighterSprite id={mem.characterId} size="sm" />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {mem.name || mem.characterId}
                          </span>
                          
                          {isAct ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: 4 }}>
                              (Active)
                            </span>
                          ) : isKo ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>
                              Fainted
                            </span>
                          ) : (
                            <div style={{ width: '100%', marginTop: 6 }}>
                              <div style={{ width: '100%', height: 5, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${hpPercent}%`, height: '100%', background: 'var(--text-primary)' }} />
                              </div>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{hpPercent}%</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Pokémon Showdown Combat Log & Live Chat Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', height: 652, background: 'var(--card-bg)', border: '2px solid var(--border-strong)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px var(--shadow-color)' }}>
          
          {/* Top Bar: Users in Room & Battle Options */}
          <div style={{ padding: '10px 14px', background: 'var(--panel-header)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-primary)', display: 'inline-block' }} />
              2 dueling users
            </span>
            <button className="btn btn-ghost" style={{ height: 26, padding: '0 10px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', border: '1px solid var(--border-strong)' }}>
              Battle Options
            </button>
          </div>

          {/* Unified Combat Stream & Chat Log */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)' }}>
            {renderShowdownLog()}
            <div ref={logEndRef} />
          </div>

          {/* Bottom Chat Input Box with Username Prompt */}
          <form onSubmit={handleSendChat} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', background: 'var(--panel-header)', borderTop: '1px solid var(--border)', gap: 8 }}>
            <span style={{ fontWeight: 900, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {myState.username || 'You'}:
            </span>
            <input
              type="text"
              className="input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="(use arrow keys) Chat in match..."
              maxLength={150}
              style={{ flex: 1, height: 32, fontSize: '0.82rem', padding: '0 10px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ height: 32, padding: '0 14px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>
              Send
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
