import React, { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import type { BattleState, Move, PlayerKey, BattleFighterState, ChatMessage, BattleLogEntry } from '../types';
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

  const myHpPct = Math.max(0, Math.round(((myActiveFighter.currentHp ?? 100) / (myActiveFighter.maxHp || 100)) * 100));
  const oppHpPct = Math.max(0, Math.round(((oppActiveFighter.currentHp ?? 100) / (oppActiveFighter.maxHp || 100)) * 100));
  const myEngPct = Math.min(100, myActiveFighter.currentEnergy ?? 0);
  const oppEngPct = Math.min(100, oppActiveFighter.currentEnergy ?? 0);

  const myColor = myHpPct > 50 ? '#10B981' : myHpPct > 20 ? '#F59E0B' : '#EF4444';
  const oppColor = oppHpPct > 50 ? '#10B981' : oppHpPct > 20 ? '#F59E0B' : '#EF4444';

  function formatRelicName(relicId?: string) {
    if (!relicId) return '';
    return relicId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  return (
    <div className="battle-arena-container">
      
      {/* --- TOP HUD --- */}
      <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', zIndex: 10, pointerEvents: 'none' }}>
        
        {/* PLAYER HUD */}
        <div className="hud-panel" style={{ width: '320px', pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '0.03em' }}>{myState.username || 'You'}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8' }}>Lv.100</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
              {myActiveFighter.name || myActiveFighter.characterId}
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: myColor }}>{myHpPct}%</span>
          </div>
          
          <div className="health-bar-container">
            <div className="health-bar-fill" style={{ width: `${myHpPct}%`, background: myColor, boxShadow: `0 0 10px ${myColor}` }} />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="energy-bar-container" style={{ flex: 1 }}>
              <div className="energy-bar-fill" style={{ width: `${myEngPct}%`, boxShadow: '0 0 8px #F59E0B' }} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#FCD34D' }}>⚡ {myEngPct}</span>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {myActiveFighter.statusEffects?.map((st, i) => (
              <span key={i} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>
                {st.type}
              </span>
            ))}
            {myActiveFighter.relicId && (
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>
                Relic: {formatRelicName(myActiveFighter.relicId)}
              </span>
            )}
          </div>
        </div>

        {/* TURN INDICATOR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 10 }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '20px', padding: '6px 20px', backdropFilter: 'blur(10px)' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.1em' }}>TURN {battleState.turn || 1}</span>
          </div>
          {onLeaveRoom && (
            <button onClick={onLeaveRoom} className="btn-ghost" style={{ pointerEvents: 'auto', marginTop: 12, padding: '4px 12px', fontSize: '0.75rem', borderRadius: 20, color: '#F43F5E', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
              Flee Battle
            </button>
          )}
        </div>

        {/* OPPONENT HUD */}
        <div className="hud-panel" style={{ width: '320px', pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8' }}>Lv.100</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '0.03em' }}>{opponentState.username || 'Opponent'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: oppColor }}>{oppHpPct}%</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
              {oppActiveFighter.name || oppActiveFighter.characterId}
            </span>
          </div>
          
          <div className="health-bar-container">
            <div className="health-bar-fill" style={{ width: `${oppHpPct}%`, background: oppColor, boxShadow: `0 0 10px ${oppColor}`, float: 'right' }} />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse' }}>
            <div className="energy-bar-container" style={{ flex: 1, transform: 'scaleX(-1)' }}>
              <div className="energy-bar-fill" style={{ width: `${oppEngPct}%`, boxShadow: '0 0 8px #F59E0B' }} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#FCD34D' }}>⚡ {oppEngPct}</span>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
            {oppActiveFighter.statusEffects?.map((st, i) => (
              <span key={i} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>
                {st.type}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* --- CENTER STAGE --- */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15%', zIndex: 1, pointerEvents: 'none' }}>
        
        {/* Player Sprite */}
        <div style={{ transform: 'scale(1.5) translateY(-30px)', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.8)) drop-shadow(0 0 20px rgba(56, 189, 248, 0.3))' }}>
          <div style={{ width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scaleX(-1)' }}>
            <img 
              src={`/characters/${myActiveFighter.characterId.toLowerCase()}.jpg`} 
              alt={myActiveFighter.characterId}
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.setAttribute('style', 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;'); }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }} 
            />
            <div style={{ display: 'none', transform: 'scaleX(-1)' }}>
              <FighterLogo id={myActiveFighter.characterId} size={100} color="#38BDF8" />
            </div>
          </div>
        </div>

        {/* Opponent Sprite */}
        <div style={{ transform: 'scale(1.5) translateY(-30px)', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.8)) drop-shadow(0 0 20px rgba(244, 63, 94, 0.3))' }}>
          <div style={{ width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={`/characters/${oppActiveFighter.characterId.toLowerCase()}.jpg`} 
              alt={oppActiveFighter.characterId}
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling!.setAttribute('style', 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;'); }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }} 
            />
            <div style={{ display: 'none' }}>
              <FighterLogo id={oppActiveFighter.characterId} size={100} color="#F43F5E" />
            </div>
          </div>
        </div>
      </div>

      {/* --- BATTLE FEED (Right edge) --- */}
      <div style={{ position: 'absolute', right: 24, bottom: 200, top: 180, width: '300px', display: 'flex', flexDirection: 'column', padding: '16px', overflowY: 'auto', zIndex: 5, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>Battle Log</div>
        <div style={{ flex: '1 1 auto' }} /> {/* pushes to bottom */}
        {battleState.log?.map((entry, idx) => (
          <div key={idx} style={{ marginBottom: 12, animation: 'modal-slide 0.3s ease out', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.8rem', color: '#E2E8F0', lineHeight: 1.4, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              <strong style={{ color: '#38BDF8' }}>{entry.actorName}</strong> used <span style={{ color: '#FCD34D', fontWeight: 800 }}>{entry.action}</span>!
            </div>
            {entry.damage && <div style={{ color: '#F87171', fontSize: '0.75rem', fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,0.8)', marginTop: 4 }}>💥 Dealt {entry.damage} DMG!</div>}
            {entry.healing && <div style={{ color: '#34D399', fontSize: '0.75rem', fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,0.8)', marginTop: 4 }}>✨ Recovered {entry.healing} HP!</div>}
            {entry.isCrit && <div style={{ color: '#FBBF24', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', textShadow: '0 1px 2px rgba(0,0,0,0.8)', marginTop: 4 }}>Critical Hit!</div>}
            {entry.missed && <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontStyle: 'italic', textShadow: '0 1px 2px rgba(0,0,0,0.8)', marginTop: 4 }}>Missed!</div>}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* --- BOTTOM UI PANELS --- */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 48px', display: 'flex', flexDirection: 'column', gap: 16, zIndex: 20, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
        
        {/* Waiting State Overlay */}
        {isWaiting && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, borderRadius: '24px 24px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="queue-spinner" style={{ width: 24, height: 24, borderColor: '#38BDF8', borderTopColor: 'transparent' }} />
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.1em' }}>WAITING FOR OPPONENT...</span>
            </div>
          </div>
        )}

        {/* Action Cards Row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, height: 110 }}>
          {myActiveFighter.moveIds?.map(mid => {
            const m = movesData.find(move => move.id === mid);
            const canAfford = myEngPct >= (m?.energyCost || 0);
            const disabled = myState.mustSwitch || !canAfford || battleState.phase === 'ended';
            
            let typeColor = '#10B981'; // self
            if (m?.type === 'physical') typeColor = '#F97316';
            if (m?.type === 'special') typeColor = '#38BDF8';
            if (m?.type === 'status') typeColor = '#A855F7';

            return (
              <button 
                key={mid} 
                className="action-card"
                disabled={disabled}
                onClick={() => handleCommitMove(mid)}
                style={{ width: '220px', '--hover-color': typeColor } as React.CSSProperties}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m?.type || 'Attack'}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#FCD34D' }}>⚡ {m?.energyCost || 0}</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#F8FAFC', marginTop: 'auto', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {m ? m.name : mid}
                </div>
              </button>
            );
          })}
          
          <button 
            className="action-card"
            disabled={myState.mustSwitch || battleState.phase === 'ended'}
            onClick={() => handleCommitMove('recharge')}
            style={{ width: '180px', '--hover-color': '#FBBF24', background: 'rgba(217, 119, 6, 0.15)' } as React.CSSProperties}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recover</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F8FAFC', marginTop: 'auto' }}>
              Focus & Regain
            </div>
            <div style={{ position: 'absolute', bottom: 14, right: 14, opacity: 0.5 }}>
              <FighterLogo id="energy" size={24} color="#FBBF24" />
            </div>
          </button>
        </div>

        {/* Bench Row & Chat */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
          
          {/* Bench Roster */}
          <div style={{ display: 'flex', gap: 10 }}>
            {myState.team?.map((mem, idx) => {
              const isAct = idx === myState.activeIdx;
              const isKo = (mem.currentHp ?? 0) <= 0;
              const hpPercent = Math.max(0, Math.round(((mem.currentHp ?? 100) / (mem.maxHp || 100)) * 100));
              const disabled = isAct || isKo || battleState.phase === 'ended';
              
              return (
                <button
                  key={idx}
                  className="roster-chip"
                  disabled={disabled}
                  onClick={() => handleCommitSwitch(idx)}
                  style={{ borderColor: isAct ? '#38BDF8' : undefined }}
                >
                  <div style={{ filter: isKo ? 'grayscale(1)' : 'none' }}>
                    <FighterSprite id={mem.characterId} size="sm" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '60px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isAct ? '#38BDF8' : '#F8FAFC' }}>
                      {mem.name || mem.characterId}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isKo ? '#EF4444' : '#94A3B8' }}>
                      {isKo ? 'FAINTED' : `${hpPercent}%`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} style={{ flex: '0 0 320px', display: 'flex', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Send message..."
              style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 14px', color: '#F8FAFC', fontSize: '0.85rem', outline: 'none' }}
            />
            <button type="submit" style={{ background: 'transparent', border: 'none', padding: '0 16px', color: '#38BDF8', cursor: 'pointer', fontWeight: 800 }}>SEND</button>
          </form>

        </div>
      </div>
      
      {/* MATCH END OVERLAY */}
      {battleState.phase === 'ended' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', animation: 'modal-slide 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏆</div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#38BDF8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Match Concluded</h1>
            {onLeaveRoom && (
              <button onClick={onLeaveRoom} className="btn-primary btn-lg" style={{ marginTop: 32 }}>
                Return to Lobby
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
