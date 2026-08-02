import React, { useEffect, useState } from 'react';
import type { Character, Move, Relic, TeamDoc, TeamSlot } from '../types';
import { FighterLogo } from './FighterLogo';
import { FighterSprite } from './FighterSprite';

interface TeamBuilderProps {
  token: string | null;
}

export const TeamBuilder: React.FC<TeamBuilderProps> = ({ token }) => {
  const [roster, setRoster] = useState<Character[]>([]);
  const [allMoves, setAllMoves] = useState<Move[]>([]);
  const [allRelics, setAllRelics] = useState<Relic[]>([]);
  const [teams, setTeams] = useState<TeamDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Active build state
  const [teamName, setTeamName] = useState('My Anime Roster');
  const [teamFormat, setTeamFormat] = useState('ou_6v6');
  const [slots, setSlots] = useState<TeamSlot[]>([]);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  
  // Import/Export Modal state
  const [showImportExport, setShowImportExport] = useState(false);
  const [importText, setImportText] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/roster').then(r => r.json()),
      fetch('/api/roster/moves/all').then(r => r.json()),
      fetch('/api/roster/relics/all').then(r => r.json()),
      token ? fetch('/api/teams', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()) : Promise.resolve([]),
    ])
      .then(([chars, movesData, relicsData, userTeams]) => {
        setRoster(chars);
        setAllMoves(movesData);
        setAllRelics(relicsData || []);
        setTeams(userTeams || []);
      })
      .catch((e) => {
        console.error('Failed to load teambuilder data:', e);
        setError('Failed to load game assets');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const charsById = new Map(roster.map(c => [c.id, c]));
  const movesById = new Map(allMoves.map(m => [m.id, m]));

  function addFighterToTeam(charId: string) {
    if (slots.length >= 6) {
      setError('A Showdown team can hold a maximum of 6 fighters.');
      return;
    }
    const char = charsById.get(charId);
    if (!char) return;
    const defaultMoves = char.moveIds.slice(0, 4);
    const defaultRelic = allRelics[0]?.id || undefined;
    const newSlots = [...slots, { characterId: charId, moveIds: defaultMoves, relicId: defaultRelic }];
    setSlots(newSlots);
    setActiveSlotIdx(newSlots.length - 1);
    setError(null);
  }

  function removeSlot(idx: number) {
    const updated = slots.filter((_, i) => i !== idx);
    setSlots(updated);
    if (activeSlotIdx === idx) {
      setActiveSlotIdx(updated.length > 0 ? 0 : null);
    } else if (activeSlotIdx !== null && activeSlotIdx > idx) {
      setActiveSlotIdx(activeSlotIdx - 1);
    }
  }

  function toggleMoveInSlot(slotIdx: number, moveId: string) {
    const slot = slots[slotIdx];
    if (!slot) return;
    const isPresent = slot.moveIds.includes(moveId);
    let updatedMoves: string[];
    if (isPresent) {
      updatedMoves = slot.moveIds.filter(id => id !== moveId);
    } else {
      if (slot.moveIds.length >= 4) {
        setError('Each fighter can equip a maximum of 4 moves!');
        return;
      }
      updatedMoves = [...slot.moveIds, moveId];
    }
    const next = [...slots];
    next[slotIdx] = { ...slot, moveIds: updatedMoves };
    setSlots(next);
    setError(null);
  }

  function selectRelic(slotIdx: number, relicId: string) {
    const next = [...slots];
    next[slotIdx] = { ...next[slotIdx], relicId: relicId || undefined };
    setSlots(next);
  }

  // Showdown Text Import/Export Logic
  function generateShowdownText(): string {
    return slots.map(slot => {
      const char = charsById.get(slot.characterId);
      const relic = allRelics.find(r => r.id === slot.relicId);
      let header = char?.name || slot.characterId;
      if (relic) header += ` @ ${relic.name}`;
      const moveLines = slot.moveIds.map(mid => {
        const mv = movesById.get(mid);
        return `- ${mv?.name || mid}`;
      });
      return [header, ...moveLines].join('\n');
    }).join('\n\n');
  }

  function handleImportShowdownText(text: string) {
    const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const importedSlots: TeamSlot[] = [];
    for (const block of blocks) {
      if (importedSlots.length >= 6) break;
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;
      
      const [charPart, relicPart] = lines[0].split('@').map(s => s.trim());
      const matchedChar = roster.find(c => c.name.toLowerCase() === charPart.toLowerCase() || c.id.toLowerCase() === charPart.toLowerCase());
      if (!matchedChar) continue;

      let matchedRelicId: string | undefined = undefined;
      if (relicPart) {
        const rel = allRelics.find(r => r.name.toLowerCase() === relicPart.toLowerCase() || r.id.toLowerCase() === relicPart.toLowerCase());
        if (rel) matchedRelicId = rel.id;
      }

      const selectedMoveIds: string[] = [];
      for (let i = 1; i < lines.length && selectedMoveIds.length < 4; i++) {
        const lineClean = lines[i].replace(/^-/, '').trim();
        const matchedMove = allMoves.find(m => m.name.toLowerCase() === lineClean.toLowerCase() || m.id.toLowerCase() === lineClean.toLowerCase());
        if (matchedMove && matchedChar.moveIds.includes(matchedMove.id)) {
          selectedMoveIds.push(matchedMove.id);
        }
      }

      importedSlots.push({
        characterId: matchedChar.id,
        moveIds: selectedMoveIds.length > 0 ? selectedMoveIds : matchedChar.moveIds.slice(0, 4),
        relicId: matchedRelicId,
      });
    }

    if (importedSlots.length > 0) {
      setSlots(importedSlots);
      setActiveSlotIdx(0);
      setSuccess('Successfully imported anime roster!');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('Could not parse valid anime champions from text.');
    }
    setShowImportExport(false);
  }

  async function handleSaveTeam() {
    if (slots.length === 0 || !teamName.trim() || !token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: teamName.trim(),
          format: teamFormat,
          slots,
          characterIds: slots.map(s => s.characterId),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const team: TeamDoc = await res.json();
      setTeams(prev => [team, ...prev.filter(t => t.id !== team.id)]);
      setSuccess(`Team "${team.name}" saved successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save team');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTeam(id: string) {
    if (!token) return;
    await fetch(`/api/teams/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setTeams(prev => prev.filter(t => t.id !== id));
  }

  function handleLoadTeam(team: TeamDoc) {
    setTeamName(team.name);
    setTeamFormat(team.format || 'ou_6v6');
    const loadSlots = (team.slots && team.slots.length > 0)
      ? team.slots
      : (team.characterIds || []).map(cid => {
          const c = charsById.get(cid);
          return { characterId: cid, moveIds: c?.moveIds.slice(0, 4) || [] };
        });
    setSlots(loadSlots);
    if (loadSlots.length > 0) setActiveSlotIdx(0);
    setSuccess(`Loaded team "${team.name}" into editor`);
    setTimeout(() => setSuccess(null), 2500);
  }

  if (loading) {
    return (
      <div className="queue-overlay" style={{ padding: 64, textAlign: 'center' }}>
        <div className="queue-spinner" />
        <span className="text-secondary" style={{ display: 'block', marginTop: 16 }}>Loading Anime Showdown Assets…</span>
      </div>
    );
  }

  const activeSlot = activeSlotIdx !== null ? slots[activeSlotIdx] : null;
  const activeChar = activeSlot ? charsById.get(activeSlot.characterId) : null;
  const availableMovesForActive = activeChar ? activeChar.moveIds.map(id => movesById.get(id)).filter((m): m is Move => !!m) : [];

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: 1350 }}>
      
      {/* Header Bar */}
      <div className="glass-elevated" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, padding: '20px 24px', border: '1px solid var(--glass-border)' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 12, margin: 0, fontWeight: 900 }}>
            <FighterLogo id="shield" size={30} color="var(--accent)" />
            <span>ANIME TEAMBUILDER</span>
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.9rem', margin: '4px 0 0' }}>
            Assemble your dream roster of up to 6 animated champions. Equip moves, relics, and prepare for battle.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 700 }}
            onClick={() => {
              setImportText(generateShowdownText());
              setShowImportExport(true);
            }}
          >
            <FighterLogo id="swords" size={16} color="currentColor" />
            <span>Import / Export Text</span>
          </button>
          {token && (
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontWeight: 800, background: 'linear-gradient(135deg, #38BDF8, #4F46E5)' }}
              onClick={handleSaveTeam}
              disabled={slots.length === 0 || saving || !teamName.trim()}
            >
              <span>{saving ? 'Saving...' : 'Save Roster'}</span>
            </button>
          )}
        </div>
      </div>

      {error && <div className="glass p-3 mb-4" style={{ borderColor: '#EF4444', color: '#EF4444', fontWeight: 700, fontSize: '0.9rem' }}>{error}</div>}
      {success && <div className="glass p-3 mb-4" style={{ borderColor: '#34D399', color: '#34D399', fontWeight: 700, fontSize: '0.9rem' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(290px, 340px) 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Team Roster overview */}
        <div className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18, border: '1px solid var(--glass-border)' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>TEAM NAME</label>
            <input
              className="input"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name..."
              maxLength={40}
              style={{ marginTop: 4, height: 40, fontWeight: 700 }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>BATTLE FORMAT</label>
            <select
              className="input"
              value={teamFormat}
              onChange={(e) => setTeamFormat(e.target.value)}
              style={{ marginTop: 4, height: 40, fontWeight: 600 }}
            >
              <option value="ou_6v6">[OU] 6v6 Battle Arena (Up to 6 Fighters)</option>
              <option value="blitz_3v3">[Blitz] 3v3 Fast Combat (First 3 Fighters)</option>
              <option value="quick_1v1">[Quick] 1v1 Solo Duel (Lead Only)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)' }}>
              ROSTER SLOTS ({slots.length} / 6)
            </span>
            {slots.length > 0 && (
              <button className="inline-text-btn" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444' }} onClick={() => { setSlots([]); setActiveSlotIdx(null); }}>
                Clear Roster
              </button>
            )}
          </div>

          {/* Slots List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180 }}>
            {slots.length === 0 ? (
              <div className="glass" style={{ padding: '32px 16px', textAlign: 'center', opacity: 0.7, borderStyle: 'dashed' }}>
                <FighterLogo id="shield" size={36} color="var(--text-muted)" />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 10, fontWeight: 700 }}>No champions equipped yet.</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Click on an animated champion card on the right to recruit them!</p>
              </div>
            ) : (
              slots.map((slot, idx) => {
                const c = charsById.get(slot.characterId);
                const isSel = idx === activeSlotIdx;
                const r = allRelics.find(rel => rel.id === slot.relicId);
                return (
                  <div
                    key={idx}
                    className={`glass p-3 ${isSel ? 'glass-elevated' : ''}`}
                    onClick={() => setActiveSlotIdx(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      border: isSel ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                      background: isSel ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FighterSprite id={slot.characterId} size="sm" />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isSel ? '#FFF' : 'var(--text-primary)' }}>
                          {c?.name || slot.characterId}{' '}
                          {idx === 0 ? <span style={{ fontSize: '0.68rem', color: 'var(--accent)', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>LEAD</span> : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {r ? `Held: ${r.name}` : 'No Relic'} · {slot.moveIds.length} Moves
                        </div>
                      </div>
                    </div>
                    <button
                      className="inline-text-btn"
                      style={{ fontSize: '1.4rem', padding: '0 6px', color: '#EF4444' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSlot(idx);
                      }}
                      title="Remove champion"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Saved Teams Drawer */}
          <div style={{ marginTop: 12, borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 10, color: 'var(--text-muted)' }}>SAVED TEAMS CLOUD SYNC</h4>
            {!token ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>Log in via the top nav to cloud-save rosters across devices.</p>
            ) : teams.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>No saved teams yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                {teams.map((t) => (
                  <div key={t.id} className="glass p-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(t.slots?.length || t.characterIds?.length || 0)} Fighters · {t.format || 'ou_6v6'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => handleLoadTeam(t)}>Load</button>
                      <button className="inline-text-btn" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, padding: '0 4px' }} onClick={() => handleDeleteTeam(t.id)}>Del</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Fighter Selector & Active Fighter Customizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* Active Fighter Editor (When a slot is selected) */}
          {activeSlot && activeChar ? (
            <div className="glass-elevated p-6" style={{ borderLeft: '5px solid var(--accent)', background: 'radial-gradient(ellipse at top right, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.95) 75%)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 24, borderBottom: '1px solid var(--glass-border)', paddingBottom: 20 }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <FighterSprite id={activeChar.id} size="xl" />
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: 20 }}>
                      SLOT #{activeSlotIdx! + 1} CONFIGURATION
                    </span>
                    <h3 style={{ fontSize: '2rem', margin: '8px 0 4px', fontWeight: 900, color: '#FFF' }}>{activeChar.name}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 12 }}>{activeChar.title}</div>
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.82rem', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                      <span style={{ color: '#34D399', fontWeight: 800 }}>HP: {activeChar.baseStats.maxHp}</span>
                      <span style={{ color: '#F97316', fontWeight: 800 }}>ATK: {activeChar.baseStats.attack}</span>
                      <span style={{ color: '#38BDF8', fontWeight: 800 }}>DEF: {activeChar.baseStats.defense}</span>
                      <span style={{ color: '#FDE047', fontWeight: 800 }}>SPD: {activeChar.baseStats.speed}</span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-ghost"
                  style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700 }}
                  onClick={() => setActiveSlotIdx(null)}
                >
                  Done Editing
                </button>
              </div>

              {/* Relic selection */}
              <div style={{ marginBottom: 26 }}>
                <label className="form-label" style={{ fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#FFF' }}>
                  <FighterLogo id="shield" size={18} color="var(--accent)" />
                  <span>EQUIPPED ANIME RELIC (HELD ITEM)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                  {allRelics.map((r) => {
                    const isEquipped = activeSlot.relicId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => selectRelic(activeSlotIdx!, r.id)}
                        className="glass p-3"
                        style={{
                          cursor: 'pointer',
                          border: isEquipped ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                          background: isEquipped ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0,0,0,0.3)',
                          borderRadius: 10,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', display: 'flex', justifyContent: 'space-between', color: isEquipped ? '#FFF' : 'var(--text-primary)' }}>
                          <span>{r.name}</span>
                          {isEquipped && <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 900 }}>EQUIPPED</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>{r.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Move selection */}
              <div>
                <label className="form-label" style={{ fontSize: '0.88rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#FFF' }}>
                  <FighterLogo id="swords" size={18} color="var(--accent)" />
                  <span>SELECT ATTACK MOVES (Pick up to 4 — currently {activeSlot.moveIds.length}/4)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                  {availableMovesForActive.map((m) => {
                    const isSelected = activeSlot.moveIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMoveInSlot(activeSlotIdx!, m.id)}
                        className="glass p-3"
                        style={{
                          cursor: 'pointer',
                          border: isSelected ? '2px solid #34D399' : '1px solid var(--glass-border)',
                          background: isSelected ? 'rgba(52, 211, 153, 0.12)' : 'rgba(0,0,0,0.3)',
                          borderRadius: 10,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.92rem', color: isSelected ? '#FFF' : 'var(--text-primary)' }}>
                          <span>{m.name}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: m.type === 'physical' ? '#F97316' : m.type === 'special' ? '#38BDF8' : '#A855F7', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{m.type}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>{m.description}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, display: 'flex', gap: 14, fontWeight: 700 }}>
                          {m.power ? <span>PWR: {m.power}</span> : null}
                          <span>COST: {m.energyCost} ENG</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : null}

          {/* Roster Grid to add fighters */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <FighterLogo id="swords" size={24} color="var(--accent)" />
              <h3 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 900 }}>AVAILABLE ANIME CHAMPIONS</h3>
            </div>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: 20 }}>
              Click any animated character card below to append them directly into your active Showdown roster team.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {roster.map((char) => (
                <div
                  key={char.id}
                  onClick={() => addFighterToTeam(char.id)}
                  className="roster-card"
                  style={{ '--char-color': '#4F46E5', cursor: 'pointer', padding: 14, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--glass-border)', borderRadius: 16, transition: 'all 0.25s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' } as React.CSSProperties}
                >
                  <FighterSprite id={char.id} size="lg" showNameTag={false} />
                  
                  <div style={{ width: '100%', marginTop: 12 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFF' }}>{char.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{char.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8, background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: 6 }}>
                      HP: {char.baseStats.maxHp} · SPD: {char.baseStats.speed}
                    </div>
                    <button className="btn btn-primary w-full" style={{ marginTop: 12, padding: '8px 12px', fontSize: '0.82rem', fontWeight: 800 }}>
                      + Recruit Champion
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Showdown Import/Export Modal */}
      {showImportExport && (
        <div className="winner-overlay" style={{ zIndex: 1000, padding: 16 }}>
          <div className="glass-elevated" style={{ padding: 32, width: '100%', maxWidth: 650, display: 'flex', flexDirection: 'column', gap: 18, border: '1px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>SHOWDOWN PLAINTEXT IMPORT / EXPORT</h3>
              <button className="inline-text-btn" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)' }} onClick={() => setShowImportExport(false)}>×</button>
            </div>
            <p className="text-secondary" style={{ fontSize: '0.9rem', margin: 0 }}>
              Paste Showdown format text below to import a full squad, or copy your active roster setup to share with duelists.
            </p>
            <textarea
              className="input"
              rows={12}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Kaze @ Senzu Bean\n- Basic Attack\n- Poison Strike\n\nRyuu @ Berserk Seal\n- Dragon Fist`}
              style={{ fontFamily: 'monospace', fontSize: '0.92rem', width: '100%', padding: 16, lineHeight: 1.5 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
              <button className="btn btn-ghost" style={{ padding: '10px 20px', fontWeight: 700 }} onClick={() => setShowImportExport(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontWeight: 800 }}
                onClick={() => handleImportShowdownText(importText)}
              >
                Apply Roster Setup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
