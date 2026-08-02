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
  onLeaveRoom?: () => void;
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
  onLeaveRoom,
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
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {team.map((m, idx) => {
          const isKo = (m.currentHp ?? 0) <= 0;
          const isAct = idx === activeIndex;
          return (
            <div
              key={idx}
              title={`${m.name || m.characterId}: ${m.currentHp}/${m.maxHp} HP`}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: isKo ? 'var(--text-muted)' : isAct ? 'var(--text-primary)' : 'var(--panel-header)',
                border: '2px solid var(--border-strong)',
                position: 'relative',
                opacity: isKo ? 0.35 : 1,
                boxShadow: isAct ? '0 0 6px var(--text-primary)' : 'none',
              }}
            >
              <div style={{ width: '100%', height: '50%', background: isKo ? 'var(--text-muted)' : 'var(--text-primary)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }} />
              <div style={{ width: '100%', height: '50%', background: 'var(--card-bg)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }} />
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
    let currentTurnTracker = 0;
    const renderedElements: React.ReactNode[] = [];

    // Header box
    renderedElements.push(
      <div key="battle-init-info" style={{ padding: '6px 4px', fontSize: '0.82rem', color: 'var(--text-secondary)', borderBottom: '1px dashed var(--border)', marginBottom: 8 }}>
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
              margin: '10px 0 6px',
              padding: '4px 10px',
              background: 'var(--panel-header)',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              fontWeight: 900,
              fontSize: '0.85rem',
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
        <div key={`log-entry-${idx}`} style={{ padding: '2px 4px', fontSize: '0.82rem', lineHeight: 1.35, color: 'var(--text-primary)' }}>
          <span style={{ fontWeight: 800 }}>{entry.actorName}</span> used <strong style={{ textDecoration: 'underline' }}>{entry.action}</strong>!
          {entry.damage && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 12, color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.8rem' }}>
              <FighterLogo id="clash" size={14} color="currentColor" /> <span>Dealt <strong>{entry.damage} DMG!</strong></span>
            </span>
          )}
          {entry.healing && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 12, color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.8rem' }}>
              <FighterLogo id="heal" size={14} color="currentColor" /> <span>Restored <strong>{entry.healing} HP!</strong></span>
            </span>
          )}
          {entry.isCrit && <span style={{ marginLeft: 6, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '0.72rem', padding: '1px 4px', border: '1px solid var(--text-primary)', borderRadius: 4 }}>Critical Hit!</span>}
          {entry.missed && <span style={{ marginLeft: 6, fontStyle: 'italic', color: 'var(--text-muted)' }}>(But it missed!)</span>}
        </div>
      );
    });

    if (chatMessages.length > 0) {
      renderedElements.push(
        <div key="chat-history-divider" style={{ marginTop: 10, paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
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
    <div style={{ height: '100%', width: '100%', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 12, overflow: 'hidden' }}>

      {/* LEFT COLUMN: Stage (flex 1) & Tactical Action Deck (auto) */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', gap: 10 }}>
        
        {/* ── 1. THE ARENA STAGE (Flex-grows to fit exact screen without scrolling) ──────── */}
        <div
          style={{
            flex: '1 1 0%',
            minHeight: 160,
            background: 'var(--stage-bg)',
            border: '2px solid var(--border-strong)',
            borderRadius: 8,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 50px var(--shadow-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '12px 16px',
          }}
        >
          {/* Subtle arena ground line */}
          <div style={{ position: 'absolute', top: '55%', left: '5%', right: '5%', height: 1, background: 'linear-gradient(90deg, transparent, var(--border), transparent)', zIndex: 0 }} />

          {/* Top-Left: Turn Counter Badge */}
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '4px 12px',
              background: 'var(--card-bg)',
              border: '2px solid var(--border-strong)',
              borderRadius: 6,
              fontWeight: 900,
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              boxShadow: '0 3px 8px var(--shadow-color)',
              zIndex: 10,
            }}
          >
            Turn {battleState.turn || 1}
          </div>

          {/* Upper-Right: Opponent Status Capsule + Active Sprite (No Overlaps!) */}
          <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', alignItems: 'flex-start', gap: 16, zIndex: 5 }}>
            
            {/* Unified Trainer & Showdown HP Capsule */}
            <div style={{ background: 'var(--card-bg)', border: '2px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', width: 230, boxShadow: '0 4px 14px var(--shadow-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
                  {opponentState.username || 'Opponent'}
                </span>
                {renderTeamBeads(opponentState.team, opponentState.activeIdx)}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                  {oppActiveFighter?.name || oppActiveFighter?.characterId} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>♂ L100</span>
                </span>
                <span style={{ fontWeight: 900, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{oppHpPct}%</span>
              </div>
              
              <div style={{ width: '100%', height: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border-strong)', borderRadius: 5, overflow: 'hidden', padding: 1 }}>
                <div style={{ width: `${oppHpPct}%`, height: '100%', background: oppHpPct > 50 ? 'var(--text-primary)' : oppHpPct > 20 ? 'var(--text-secondary)' : 'var(--text-muted)', borderRadius: 3, transition: 'width 0.3s ease' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                <span>Status: {oppActiveFighter.statusEffects && oppActiveFighter.statusEffects.length > 0 ? oppActiveFighter.statusEffects[0].type : 'Normal'}</span>
                <span>ENG: {oppActiveFighter?.currentEnergy ?? 0}%</span>
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <FighterSprite id={oppActiveFighter?.characterId || 'kaze'} size="lg" />
            </div>
          </div>

          {/* Lower-Left: Player Active Sprite + Status Capsule (No Overlaps!) */}
          <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', alignItems: 'flex-end', gap: 16, zIndex: 5 }}>
            <div style={{ marginBottom: 4 }}>
              <FighterSprite id={myActiveFighter?.characterId || 'kaze'} size="lg" flip />
            </div>

            {/* Unified Trainer & Showdown HP Capsule */}
            <div style={{ background: 'var(--card-bg)', border: '2px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', width: 250, boxShadow: '0 4px 14px var(--shadow-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                  {myState.username || 'You'}
                </span>
                {renderTeamBeads(myState.team, myState.activeIdx)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                  {myActiveFighter?.name || myActiveFighter?.characterId} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>♂ L100</span>
                </span>
                <span style={{ fontWeight: 900, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{myHpPct}%</span>
              </div>
              
              {/* HP Meter */}
              <div style={{ width: '100%', height: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border-strong)', borderRadius: 5, overflow: 'hidden', padding: 1, marginBottom: 4 }}>
                <div style={{ width: `${myHpPct}%`, height: '100%', background: myHpPct > 50 ? 'var(--text-primary)' : myHpPct > 20 ? 'var(--text-secondary)' : 'var(--text-muted)', borderRadius: 3, transition: 'width 0.3s ease' }} />
              </div>

              {/* Energy / PP Meter */}
              <div style={{ width: '100%', height: 4, background: 'var(--bg-surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, myActiveFighter?.currentEnergy ?? 0)}%`, height: '100%', background: 'var(--text-secondary)', transition: 'width 0.3s ease' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                <span>HP {myActiveFighter?.currentHp ?? 0} / {myActiveFighter?.maxHp ?? 100}</span>
                <span>ENG {myActiveFighter?.currentEnergy ?? 0}%</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── 2. THE TACTICAL CONTROL DECK (Fixed compact deck on bottom left) ───── */}
        <div style={{ flex: '0 0 auto', background: 'var(--card-bg)', border: '2px solid var(--border-strong)', borderRadius: 8, padding: '10px 14px', overflow: 'hidden' }}>
          
          {battleState.phase === 'ended' ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
              This showdown match has officially concluded. Review the battle history on the right.
            </div>
          ) : isWaiting ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: 160, color: 'var(--text-primary)' }}>
              <div className="queue-spinner" style={{ width: 24, height: 24, borderWidth: 3, borderColor: 'var(--text-primary)', borderTopColor: 'transparent' }} />
              <span style={{ fontSize: '1.05rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Waiting for opponent...</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>You have committed your tactical decision for this turn.</span>
            </div>
          ) : (
            <div>
              
              {/* Header Banner: What will Fighter do? */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>What will</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {myActiveFighter?.name || myActiveFighter?.characterId}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>do?</span>
                  <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 4, background: 'var(--panel-header)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    HP {myActiveFighter?.currentHp ?? 0}/{myActiveFighter?.maxHp ?? 100}
                  </span>
                </div>
                <div>
                  <button className="btn btn-ghost" style={{ height: 26, padding: '0 10px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', borderColor: 'var(--border)' }}>
                    ⏳ Timer & Options
                  </button>
                </div>
              </div>

              {/* Section 1: ATTACK COMMANDS */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>■ Attack</span>
                  {myState.mustSwitch && <span style={{ color: '#EF4444', fontSize: '0.75rem', textTransform: 'none' }}>(Disabled — You must switch in a replacement fighter!)</span>}
                </div>

                {/* 4-Column Move Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
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
                          height: 56,
                          padding: '6px 8px',
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
                          boxShadow: !disabled ? '0 2px 5px var(--shadow-color)' : 'none',
                        }}
                        onMouseOver={(e) => {
                          if (!disabled) e.currentTarget.style.borderColor = 'var(--border-strong)';
                        }}
                        onMouseOut={(e) => {
                          if (!disabled) e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        <div style={{ fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m ? m.name : mid}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.68rem', fontWeight: 800 }}>
                          <span style={{ textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                            {m?.type || 'Attack'}
                          </span>
                          <span style={{ background: 'var(--panel-header)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>
                            {m?.energyCost || 0} ENG
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Dedicated Energy Regain Command */}
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => handleCommitMove('recharge')}
                    disabled={myState.mustSwitch}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 14px',
                      borderRadius: 6,
                      background: 'linear-gradient(to right, var(--panel-header), var(--card-bg))',
                      border: '2px solid var(--border-strong)',
                      color: 'var(--text-primary)',
                      cursor: myState.mustSwitch ? 'not-allowed' : 'pointer',
                      opacity: myState.mustSwitch ? 0.4 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                      boxShadow: !myState.mustSwitch ? '0 2px 8px var(--shadow-color)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      if (!myState.mustSwitch) e.currentTarget.style.borderColor = 'var(--text-primary)';
                    }}
                    onMouseOut={(e) => {
                      if (!myState.mustSwitch) e.currentTarget.style.borderColor = 'var(--border-strong)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FighterLogo id="energy" size={18} color="currentColor" />
                      <span>Focus &amp; Regain Energy</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', background: 'var(--bg-base)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', fontWeight: 800 }}>
                      +50 ENG RECOVER (0 ENG)
                    </div>
                  </button>
                </div>
              </div>

              {/* Terastallize / Relic Option Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel-header)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 10px', marginBottom: 8, fontSize: '0.78rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800, color: 'var(--text-primary)', marginRight: 6, textTransform: 'uppercase' }}>
                  <FighterLogo id="shield" size={15} color="currentColor" />
                  <span>Equipped Relic:</span>
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{formatRelicName(myActiveFighter?.relicId)}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)', padding: '1px 6px', border: '1px solid var(--border-strong)', borderRadius: 3, textTransform: 'uppercase' }}>
                  {myActiveFighter?.relicUsed ? 'Triggered' : 'Active Passively'}
                </span>
              </div>

              {/* Section 2: SWITCH COMMANDS */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  ■ Switch
                </div>

                {/* 6-Column Roster Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
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
                          padding: '4px 4px',
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
                        <div style={{ marginBottom: 2 }}>
                          <FighterSprite id={mem.characterId} size="sm" />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mem.name || mem.characterId}
                        </span>
                        
                        {isAct ? (
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: 2 }}>
                            (Active)
                          </span>
                        ) : isKo ? (
                          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
                            Fainted
                          </span>
                        ) : (
                          <div style={{ width: '100%', marginTop: 3 }}>
                            <div style={{ width: '100%', height: 4, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${hpPercent}%`, height: '100%', background: 'var(--text-primary)' }} />
                            </div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{hpPercent}%</span>
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--card-bg)', border: '2px solid var(--border-strong)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px var(--shadow-color)' }}>
        
        {/* Top Bar: Users in Room, Battle Options & Leave Room */}
        <div style={{ padding: '8px 12px', background: 'var(--panel-header)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: '0 0 auto' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-primary)', display: 'inline-block' }} />
            2 dueling users
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost" style={{ height: 26, padding: '0 8px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', border: '1px solid var(--border)' }}>
              Options
            </button>
            {onLeaveRoom && (
              <button
                className="btn btn-ghost"
                onClick={onLeaveRoom}
                style={{ height: 26, padding: '0 8px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', border: '1px solid var(--border-strong)' }}
              >
                Leave Room
              </button>
            )}
          </div>
        </div>

        {/* Unified Combat Stream & Chat Log */}
        <div style={{ flex: '1 1 0%', overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)' }}>
          {renderShowdownLog()}
          <div ref={logEndRef} />
        </div>

        {/* Bottom Chat Input Box with Username Prompt */}
        <form onSubmit={handleSendChat} style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: 'var(--panel-header)', borderTop: '1px solid var(--border)', gap: 8, flex: '0 0 auto' }}>
          <span style={{ fontWeight: 900, fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
            {myState.username || 'You'}:
          </span>
          <input
            type="text"
            className="input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Chat in match..."
            maxLength={150}
            style={{ flex: 1, height: 30, fontSize: '0.8rem', padding: '0 8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          <button type="submit" className="btn btn-primary" style={{ height: 30, padding: '0 12px', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>
            Send
          </button>
        </form>
      </div>

    </div>
  );
};
