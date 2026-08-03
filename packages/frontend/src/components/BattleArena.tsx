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
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {team.map((m, idx) => {
          const isKo = (m.currentHp ?? 0) <= 0;
          const isAct = idx === activeIndex;
          const hpPercent = Math.round(((m.currentHp ?? 100) / (m.maxHp || 100)) * 100);
          const color = isKo ? '#64748B' : hpPercent > 50 ? '#10B981' : hpPercent > 20 ? '#F59E0B' : '#EF4444';
          return (
            <div
              key={idx}
              title={`${m.name || m.characterId}: ${m.currentHp}/${m.maxHp} HP (${hpPercent}%)`}
              style={{
                width: 14,
                height: 14,
                borderRadius: isAct ? '3px' : '50%',
                background: isKo ? '#1E293B' : isAct ? color : 'rgba(30, 41, 59, 0.8)',
                border: `2px solid ${isAct ? '#38BDF8' : isKo ? '#475569' : color}`,
                position: 'relative',
                transform: isAct ? 'rotate(45deg) scale(1.15)' : 'none',
                boxShadow: isAct ? `0 0 10px ${color}, 0 0 6px #38BDF8` : isKo ? 'none' : `0 0 6px ${color}88`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {!isKo && !isAct && (
                <div style={{ position: 'absolute', inset: 2, background: color, borderRadius: '50%' }} />
              )}
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
      <div key="battle-init-info" style={{ padding: '8px 10px', background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.85) 100%)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 6, fontSize: '0.75rem', color: '#CBD5E1', marginBottom: 8, boxShadow: '0 3px 10px rgba(0,0,0,0.4)' }}>
        <div style={{ fontWeight: 900, color: '#38BDF8', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.02em' }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
          BATTLE ENGAGED: {myState.username || 'You'} vs {opponentState.username || 'Opponent'}!
        </div>
        <div style={{ fontSize: '0.7rem', marginTop: 5, color: '#F8FAFC', fontWeight: 700 }}>Format: <span style={{ color: '#E2E8F0', background: 'rgba(56,189,248,0.15)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(56,189,248,0.3)' }}>[OU] 6v6 Standard Showdown</span></div>
        <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 4, display: 'grid', gap: 2 }}>
          <div>• Species Clause: Limit one of each Anime Champion</div>
          <div>• HP Percentage Mod: Opponent HP shown in percentages</div>
        </div>
      </div>
    );

    logEntries.forEach((entry: BattleLogEntry, idx: number) => {
      if (entry.turn > currentTurnTracker) {
        currentTurnTracker = entry.turn;
        renderedElements.push(
          <div
            key={`turn-banner-${currentTurnTracker}-${idx}`}
            style={{
              margin: '8px 0 4px',
              padding: '4px 8px',
              background: 'linear-gradient(90deg, rgba(14,165,233,0.25) 0%, rgba(30,41,59,0.9) 60%, transparent 100%)',
              borderLeft: '3px solid #38BDF8',
              borderRadius: '0 4px 4px 0',
              fontWeight: 900,
              fontSize: '0.78rem',
              color: '#F8FAFC',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 8px rgba(14,165,233,0.2)',
            }}
          >
            ⚡ Turn {currentTurnTracker} Combat Phase
          </div>
        );
      }

      renderedElements.push(
        <div key={`log-entry-${idx}`} style={{ padding: '5px 8px', margin: '3px 0', background: 'rgba(30,41,59,0.5)', borderRadius: 5, borderLeft: entry.damage ? '3px solid #F97316' : entry.healing ? '3px solid #10B981' : '3px solid #64748B', fontSize: '0.75rem', lineHeight: 1.35, color: '#F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <span style={{ fontWeight: 900, color: '#38BDF8' }}>{entry.actorName}</span> used <strong style={{ color: '#F8FAFC', textShadow: '0 0 8px rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3 }}>{entry.action}</strong>!
            </span>
          </div>
          {entry.damage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, color: '#F97316', fontWeight: 800, fontSize: '0.75rem' }}>
              <FighterLogo id="clash" size={14} color="#F97316" /> 
              <span>Dealt <strong style={{ color: '#FB923C', fontSize: '0.8rem', textShadow: '0 0 8px rgba(249,115,22,0.4)' }}>{entry.damage} DMG!</strong></span>
            </div>
          )}
          {entry.healing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, color: '#10B981', fontWeight: 800, fontSize: '0.75rem' }}>
              <FighterLogo id="heal" size={14} color="#10B981" /> 
              <span>Restored <strong style={{ color: '#34D399', fontSize: '0.8rem', textShadow: '0 0 8px rgba(16,185,129,0.4)' }}>{entry.healing} HP!</strong></span>
            </div>
          )}
          {entry.isCrit && <div style={{ marginTop: 4, display: 'inline-block', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000', fontWeight: 900, fontSize: '0.65rem', padding: '1px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 0 10px rgba(245,158,11,0.6)' }}>🔥 Critical Hit!</div>}
          {entry.missed && <div style={{ marginTop: 4, fontStyle: 'italic', color: '#94A3B8' }}>(But the attack missed its target!)</div>}
        </div>
      );
    });

    if (chatMessages.length > 0) {
      renderedElements.push(
        <div key="chat-history-divider" style={{ marginTop: 10, padding: '4px 8px', background: 'rgba(15,23,42,0.8)', borderTop: '2px solid rgba(56,189,248,0.3)', borderRadius: 4, fontSize: '0.72rem', color: '#38BDF8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          💬 Live PVP Match Transmission
        </div>
      );
      chatMessages.forEach((msg, idx) => {
        renderedElements.push(
          <div key={`chat-msg-${idx}`} style={{ padding: '4px 6px', margin: '2px 0', background: 'rgba(30,41,59,0.4)', borderRadius: 4, fontSize: '0.75rem', lineHeight: 1.3, border: '1px solid rgba(148,163,184,0.1)' }}>
            <strong style={{ color: '#38BDF8', marginRight: 5 }}>{msg.sender}:</strong>
            <span style={{ color: '#E2E8F0' }}>{msg.text}</span>
          </div>
        );
      });
    }

    return renderedElements;
  }

  const myHpPct = Math.max(0, Math.round(((myActiveFighter.currentHp ?? 100) / (myActiveFighter.maxHp || 100)) * 100));
  const oppHpPct = Math.max(0, Math.round(((oppActiveFighter.currentHp ?? 100) / (oppActiveFighter.maxHp || 100)) * 100));

  return (
    <div style={{ height: '100%', width: '100%', display: 'grid', gridTemplateColumns: '1fr 290px', gap: 8, overflow: 'hidden' }}>

      {/* LEFT COLUMN: Cinematic Cyber Arena Stage (flex 1) & Tactical Command Deck (auto) */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', gap: 6 }}>
        
        {/* ── 1. COMPACT CINEMATIC 3D ANIME ARENA STAGE ──────── */}
        <div
          style={{
            flex: '1 1 0%',
            minHeight: 135,
            background: 'radial-gradient(ellipse at center, #1E293B 0%, #090E17 100%)',
            border: '2px solid rgba(56, 189, 248, 0.4)',
            borderRadius: 8,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8), 0 0 25px rgba(56, 189, 248, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '8px 14px',
          }}
        >
          {/* Subtle tactical grid background overlay & energy ground arc */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px)', backgroundSize: '25px 25px', zIndex: 0, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '55%', left: '3%', right: '3%', height: 2, background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), rgba(244, 63, 94, 0.5), transparent)', boxShadow: '0 0 10px rgba(56,189,248,0.5)', zIndex: 1, pointerEvents: 'none' }} />

          {/* Central Animated "VS" Energy Clash Core */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 3, pointerEvents: 'none' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.85) 100%)', border: '2px solid rgba(56, 189, 248, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(56,189,248,0.5), 0 0 12px rgba(244,63,94,0.5)', position: 'relative' }}>
              <span style={{ fontWeight: 900, fontSize: '1.05rem', fontStyle: 'italic', background: 'linear-gradient(135deg, #38BDF8 0%, #F43F5E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.05em' }}>
                VS
              </span>
            </div>
            <span style={{ marginTop: 3, fontSize: '0.58rem', fontWeight: 900, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>DUELING COLISEUM</span>
          </div>

          {/* Top-Left: Tactical Turn Counter & System Status */}
          <div style={{ zIndex: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                padding: '3px 10px',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                border: '1px solid #38BDF8',
                borderRadius: 6,
                fontWeight: 900,
                fontSize: '0.76rem',
                color: '#F8FAFC',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block' }} />
              <span>Turn {battleState.turn || 1} • Combat Active</span>
            </div>
          </div>

          {/* Upper-Right: Opponent Combat Unit (HUD + Compact Portrait) */}
          <div style={{ position: 'absolute', top: 8, right: 12, display: 'flex', alignItems: 'flex-start', gap: 10, zIndex: 5 }}>
            
            {/* Opponent Status HUD Console */}
            <div style={{ background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(244, 63, 94, 0.5)', borderLeft: '4px solid #F43F5E', borderRadius: 8, padding: '6px 10px', width: 210, boxShadow: '0 6px 18px rgba(0,0,0,0.6), 0 0 12px rgba(244,63,94,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#F43F5E', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110, letterSpacing: '0.03em' }}>
                  ⚔️ {opponentState.username || 'Opponent'}
                </span>
                {renderTeamBeads(opponentState.team, opponentState.activeIdx)}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 900, fontSize: '0.84rem', color: '#F8FAFC', letterSpacing: '0.02em' }}>
                  {oppActiveFighter?.name || oppActiveFighter?.characterId} <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>♂ L100</span>
                </span>
                <span style={{ fontWeight: 900, fontSize: '0.78rem', color: oppHpPct > 50 ? '#34D399' : oppHpPct > 20 ? '#FBBF24' : '#F87171' }}>{oppHpPct}%</span>
              </div>
              
              <div style={{ width: '100%', height: 8, background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: 4, overflow: 'hidden', padding: 1, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                <div style={{ width: `${oppHpPct}%`, height: '100%', background: oppHpPct > 50 ? 'linear-gradient(90deg, #059669, #10B981)' : oppHpPct > 20 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #B91C1C, #EF4444)', borderRadius: 3, transition: 'width 0.4s ease', boxShadow: `0 0 8px ${oppHpPct > 50 ? '#10B981' : '#EF4444'}` }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.65rem', color: '#CBD5E1', fontWeight: 800, textTransform: 'uppercase' }}>
                <span style={{ background: 'rgba(244,63,94,0.2)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(244,63,94,0.4)' }}>
                  {oppActiveFighter.statusEffects && oppActiveFighter.statusEffects.length > 0 ? oppActiveFighter.statusEffects[0].type : 'NORMAL'}
                </span>
                <span style={{ color: '#FBBF24', textShadow: '0 0 6px rgba(245,158,11,0.4)' }}>ENG: {oppActiveFighter?.currentEnergy ?? 0}%</span>
              </div>
            </div>

            <div style={{ filter: 'drop-shadow(0 0 15px rgba(244, 63, 94, 0.4))' }}>
              <FighterSprite id={oppActiveFighter?.characterId || 'kaze'} size="lg" />
            </div>
          </div>

          {/* Lower-Left: Player Combat Unit (Compact Portrait + HUD) */}
          <div style={{ position: 'absolute', bottom: 8, left: 12, display: 'flex', alignItems: 'flex-end', gap: 10, zIndex: 5 }}>
            <div style={{ filter: 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.45))' }}>
              <FighterSprite id={myActiveFighter?.characterId || 'kaze'} size="lg" flip />
            </div>

            {/* Player Status HUD Console */}
            <div style={{ background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(56, 189, 248, 0.5)', borderRight: '4px solid #38BDF8', borderRadius: 8, padding: '6px 10px', width: 220, boxShadow: '0 6px 18px rgba(0,0,0,0.6), 0 0 15px rgba(56,189,248,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#38BDF8', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120, letterSpacing: '0.03em' }}>
                  🛡️ {myState.username || 'You'}
                </span>
                {renderTeamBeads(myState.team, myState.activeIdx)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 900, fontSize: '0.84rem', color: '#F8FAFC', letterSpacing: '0.02em' }}>
                  {myActiveFighter?.name || myActiveFighter?.characterId} <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>♂ L100</span>
                </span>
                <span style={{ fontWeight: 900, fontSize: '0.78rem', color: myHpPct > 50 ? '#34D399' : myHpPct > 20 ? '#FBBF24' : '#F87171' }}>{myHpPct}%</span>
              </div>
              
              {/* HP Meter */}
              <div style={{ width: '100%', height: 8, background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.25)', borderRadius: 4, overflow: 'hidden', padding: 1, marginBottom: 4, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                <div style={{ width: `${myHpPct}%`, height: '100%', background: myHpPct > 50 ? 'linear-gradient(90deg, #059669, #10B981, #34D399)' : myHpPct > 20 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #B91C1C, #EF4444)', borderRadius: 3, transition: 'width 0.4s ease', boxShadow: `0 0 10px ${myHpPct > 50 ? '#10B981' : '#EF4444'}` }} />
              </div>

              {/* Energy / PP Meter */}
              <div style={{ width: '100%', height: 4, background: 'rgba(30, 41, 59, 0.8)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                <div style={{ width: `${Math.min(100, myActiveFighter?.currentEnergy ?? 0)}%`, height: '100%', background: 'linear-gradient(90deg, #D97706, #F59E0B, #FDE047)', transition: 'width 0.3s ease', boxShadow: '0 0 6px #F59E0B' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.68rem', color: '#F8FAFC', fontWeight: 900 }}>
                <span style={{ textShadow: '0 0 6px rgba(255,255,255,0.3)' }}>HP {myActiveFighter?.currentHp ?? 0}/{myActiveFighter?.maxHp ?? 100}</span>
                <span style={{ color: '#FDE047', textShadow: '0 0 6px #D97706' }}>⚡ ENG {myActiveFighter?.currentEnergy ?? 0}%</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── 2. THE COMPACT TACTICAL COMMAND CONSOLE (Sleek action dashboard) ───── */}
        <div style={{ flex: '0 0 auto', background: 'radial-gradient(ellipse at top, #1E293B 0%, #0F172A 100%)', border: '2px solid rgba(56, 189, 248, 0.4)', borderRadius: 8, padding: '8px 12px', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0,0,0,0.6)' }}>
          
          {battleState.phase === 'ended' ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#38BDF8', fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: '0 0 12px rgba(56,189,248,0.6)' }}>
              🏆 THIS SHOWDOWN MATCH HAS OFFICIALLY CONCLUDED! REVIEW THE TELEMETRY ON THE RIGHT.
            </div>
          ) : isWaiting ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: 140, color: '#F8FAFC' }}>
              <div className="queue-spinner" style={{ width: 26, height: 26, borderWidth: 3, borderColor: '#38BDF8', borderTopColor: 'transparent', filter: 'drop-shadow(0 0 8px #38BDF8)' }} />
              <span style={{ fontSize: '0.95rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38BDF8' }}>AWAITING OPPONENT TACTICAL COMMIT...</span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Your action command is locked in for Turn {battleState.turn || 1}.</span>
            </div>
          ) : (
            <div>
              
              {/* Header Banner: What will Fighter do? */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid rgba(148, 163, 184, 0.2)', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Command Protocol:</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.04em', textShadow: '0 0 8px rgba(56,189,248,0.5)' }}>
                    {myActiveFighter?.name || myActiveFighter?.characterId}
                  </span>
                  <span style={{ marginLeft: 4, padding: '1px 6px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '0.7rem', fontWeight: 900, color: '#F8FAFC', boxShadow: '0 0 6px rgba(56,189,248,0.2)' }}>
                    HP {myActiveFighter?.currentHp ?? 0}/{myActiveFighter?.maxHp ?? 100}
                  </span>
                </div>
                <div>
                  <button className="btn btn-ghost" style={{ height: 22, padding: '0 8px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', borderColor: 'rgba(148,163,184,0.4)', color: '#CBD5E1', borderRadius: 4 }}>
                    ⏳ Timer &amp; Match Options
                  </button>
                </div>
              </div>

              {/* Section 1: ATTACK COMMANDS */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#F97316' }}>■ ATTACK ARSENAL</span>
                  {myState.mustSwitch && <span style={{ color: '#EF4444', fontSize: '0.72rem', textTransform: 'none', background: 'rgba(239,68,68,0.15)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.4)' }}>⚠️ Disabled — Active champion fainted. Switch required!</span>}
                </div>

                {/* 4-Column Move Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {(myActiveFighter?.moveIds || []).map((mid: string) => {
                    const m = movesData.find(move => move.id === mid);
                    const canAfford = (myActiveFighter?.currentEnergy ?? 0) >= (m?.energyCost || 0);
                    const disabled = myState.mustSwitch || !canAfford;
                    const isPhysical = m?.type === 'physical';
                    const isSpecial = m?.type === 'special';
                    const accentColor = isPhysical ? '#F97316' : isSpecial ? '#38BDF8' : '#10B981';
                    const bgGlow = isPhysical ? 'rgba(249, 115, 22, 0.15)' : isSpecial ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)';
                    
                    return (
                      <button
                        key={mid}
                        onClick={() => handleCommitMove(mid)}
                        disabled={disabled}
                        style={{
                          height: 44,
                          padding: '5px 8px',
                          borderRadius: 6,
                          background: disabled ? 'rgba(30, 41, 59, 0.6)' : `linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, ${bgGlow} 100%)`,
                          border: `1.5px solid ${disabled ? 'rgba(148, 163, 184, 0.2)' : accentColor}`,
                          color: '#F8FAFC',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.45 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: !disabled ? `0 2px 8px rgba(0,0,0,0.4), 0 0 8px ${accentColor}44` : 'none',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onMouseOver={(e) => {
                          if (!disabled) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.5), 0 0 14px ${accentColor}88`;
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!disabled) {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.4), 0 0 8px ${accentColor}44`;
                          }
                        }}
                      >
                        <div style={{ fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: `0 0 6px ${accentColor}66` }}>
                          {m ? m.name : mid}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.62rem', fontWeight: 800 }}>
                          <span style={{ textTransform: 'uppercase', color: accentColor, letterSpacing: '0.03em' }}>
                            {m?.type || 'Attack'}
                          </span>
                          <span style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1px 4px', borderRadius: 3, border: `1px solid ${accentColor}`, color: '#FDE047', fontWeight: 900 }}>
                            ⚡ {m?.energyCost || 0} ENG
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Secondary Tactical Module: Energy Recovery & Equipped Relic Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 6, marginTop: 6 }}>
                  <button
                    onClick={() => handleCommitMove('recharge')}
                    disabled={myState.mustSwitch}
                    style={{
                      height: 26,
                      padding: '0 10px',
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(234, 179, 8, 0.2) 100%)',
                      border: '1.5px solid #F59E0B',
                      color: '#F8FAFC',
                      cursor: myState.mustSwitch ? 'not-allowed' : 'pointer',
                      opacity: myState.mustSwitch ? 0.4 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: 900,
                      fontSize: '0.7rem',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      boxShadow: !myState.mustSwitch ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      if (!myState.mustSwitch) e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      if (!myState.mustSwitch) e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#FDE047' }}>
                      <FighterLogo id="energy" size={14} color="currentColor" />
                      <span>Focus &amp; Regain</span>
                    </div>
                    <div style={{ fontSize: '0.62rem', background: '#0F172A', color: '#FDE047', padding: '1px 6px', borderRadius: 3, border: '1px solid #D97706', fontWeight: 900 }}>
                      +50 ENG RECOVERY
                    </div>
                  </button>

                  {/* Equipped Relic Sensor Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.4)', borderLeft: '3px solid #10B981', borderRadius: 6, padding: '0 10px', height: 26, fontSize: '0.7rem', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 900, color: '#10B981', marginRight: 6, textTransform: 'uppercase' }}>
                      <FighterLogo id="shield" size={14} color="#10B981" />
                      <span>Relic:</span>
                    </span>
                    <span style={{ fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatRelicName(myActiveFighter?.relicId)}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 900, color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 3, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {myActiveFighter?.relicUsed ? '⚠️ TRIGGERED' : '✓ ACTIVE PASSIVE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: SWITCH COMMANDS */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#38BDF8' }}>■ TACTICAL BENCH SWITCH</span>
                </div>

                {/* 6-Column Roster Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                  {(myState.team || []).map((mem: BattleFighterState, idx: number) => {
                    const isAct = idx === myState.activeIdx;
                    const isKo = (mem.currentHp ?? 0) <= 0;
                    const hpPercent = Math.max(0, Math.round(((mem.currentHp ?? 100) / (mem.maxHp || 100)) * 100));
                    const disabled = isAct || isKo;
                    const cardBorder = isAct ? '#38BDF8' : isKo ? 'rgba(148, 163, 184, 0.2)' : 'rgba(56, 189, 248, 0.3)';
                    const cardBg = isAct ? 'rgba(14, 165, 233, 0.2)' : isKo ? 'rgba(15, 23, 42, 0.5)' : 'rgba(30, 41, 59, 0.8)';

                    return (
                      <button
                        key={idx}
                        onClick={() => handleCommitSwitch(idx)}
                        disabled={disabled}
                        style={{
                          padding: '4px 4px',
                          borderRadius: 6,
                          background: cardBg,
                          border: `1.5px solid ${cardBorder}`,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: isKo ? 0.4 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isAct ? '0 0 10px rgba(56,189,248,0.4)' : '0 1px 4px rgba(0,0,0,0.3)',
                        }}
                        onMouseOver={(e) => {
                          if (!disabled) {
                            e.currentTarget.style.borderColor = '#38BDF8';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!disabled) {
                            e.currentTarget.style.borderColor = cardBorder;
                            e.currentTarget.style.transform = 'none';
                          }
                        }}
                      >
                        <div style={{ marginBottom: 2 }}>
                          <FighterSprite id={mem.characterId} size="sm" />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#F8FAFC', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mem.name || mem.characterId}
                        </span>
                        
                        {isAct ? (
                          <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#38BDF8', textTransform: 'uppercase', marginTop: 2, background: 'rgba(15,23,42,0.8)', padding: '1px 5px', borderRadius: 3, border: '1px solid #38BDF8' }}>
                            ACTIVE
                          </span>
                        ) : isKo ? (
                          <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', marginTop: 2 }}>
                            FAINTED
                          </span>
                        ) : (
                          <div style={{ width: '100%', marginTop: 2 }}>
                            <div style={{ width: '100%', height: 4, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${hpPercent}%`, height: '100%', background: hpPercent > 50 ? '#10B981' : hpPercent > 20 ? '#F59E0B' : '#EF4444' }} />
                            </div>
                            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#CBD5E1', marginTop: 1, display: 'block' }}>{hpPercent}% HP</span>
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

      {/* RIGHT COLUMN: Tactical Match Telemetry & PvP Chat Console */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'radial-gradient(ellipse at top right, #1E293B 0%, #0F172A 100%)', border: '2px solid rgba(56, 189, 248, 0.4)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.7)' }}>
        
        {/* Top Bar: Users in Room, Battle Options & Leave Room */}
        <div style={{ padding: '6px 10px', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1.5px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: '0 0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#F8FAFC', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.03em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', display: 'inline-block' }} />
            2 Online Duelists
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost" style={{ height: 22, padding: '0 8px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', border: '1px solid rgba(148,163,184,0.4)', color: '#CBD5E1', borderRadius: 4 }}>
              Options
            </button>
            {onLeaveRoom && (
              <button
                className="btn btn-ghost"
                onClick={onLeaveRoom}
                style={{ height: 22, padding: '0 8px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', border: '1px solid rgba(244,63,94,0.5)', color: '#F43F5E', borderRadius: 4, background: 'rgba(244,63,94,0.1)' }}
              >
                Leave Room
              </button>
            )}
          </div>
        </div>

        {/* Unified Combat Telemetry Stream & Chat Log */}
        <div style={{ flex: '1 1 0%', overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.6)' }}>
          {renderShowdownLog()}
          <div ref={logEndRef} />
        </div>

        {/* Bottom Chat Transmission Console */}
        <form onSubmit={handleSendChat} style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: 'rgba(15, 23, 42, 0.95)', borderTop: '1.5px solid rgba(56, 189, 248, 0.3)', gap: 6, flex: '0 0 auto' }}>
          <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#38BDF8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>
            💬 {myState.username || 'You'}:
          </span>
          <input
            type="text"
            className="input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Transmit comms to opponent..."
            maxLength={150}
            style={{ flex: 1, height: 26, fontSize: '0.75rem', padding: '0 8px', background: 'rgba(30, 41, 59, 0.8)', color: '#F8FAFC', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 4 }}
          />
          <button type="submit" className="btn" style={{ height: 26, padding: '0 10px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', border: '1px solid #38BDF8', color: '#F8FAFC', borderRadius: 4, boxShadow: '0 0 8px rgba(56,189,248,0.4)' }}>
            Transmit
          </button>
        </form>
      </div>

    </div>
  );
};
