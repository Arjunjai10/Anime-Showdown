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

  const [teamName, setTeamName] = useState('My Anime Roster');
  const [teamFormat, setTeamFormat] = useState('ou_6v6');
  const [slots, setSlots] = useState<TeamSlot[]>([]);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  
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
        setError('Each fighter can equip up to 4 moves.');
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
      setSuccess('Roster imported successfully!');
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
      setSuccess(`Team "${team.name}" saved!`);
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
    setSuccess(`Loaded "${team.name}" into editor`);
    setTimeout(() => setSuccess(null), 2500);
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading Teambuilder...
      </div>
    );
  }

  const activeSlot = activeSlotIdx !== null ? slots[activeSlotIdx] : null;
  const activeChar = activeSlot ? charsById.get(activeSlot.characterId) : null;
  const availableMovesForActive = activeChar ? activeChar.moveIds.map(id => movesById.get(id)).filter((m): m is Move => !!m) : [];

  return (
    <div className="container" style={{ padding: '20px 24px', maxWidth: 1280, margin: '0 auto' }}>
      
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          background: '#111622',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FighterLogo id="shield" size={26} color="var(--accent)" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#FFF' }}>ANIME TEAMBUILDER</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Configure moves, held relics, and tactical order for up to 6 fighters.</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setImportText(generateShowdownText());
              setShowImportExport(true);
            }}
            style={{ height: 36, padding: '0 16px', fontSize: '0.82rem', fontWeight: 700, background: '#1E293B', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', borderRadius: 6, cursor: 'pointer' }}
          >
            Import / Export Text
          </button>
          {token && (
            <button
              onClick={handleSaveTeam}
              disabled={slots.length === 0 || saving || !teamName.trim()}
              style={{ height: 36, padding: '0 20px', fontSize: '0.82rem', fontWeight: 700, background: 'var(--accent, #6366F1)', border: 'none', color: '#FFF', borderRadius: 6, cursor: slots.length === 0 ? 'not-allowed' : 'pointer', opacity: slots.length === 0 ? 0.6 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Team'}
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ padding: '10px 14px', marginBottom: 16, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444', borderRadius: 8, color: '#EF4444', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}
      {success && <div style={{ padding: '10px 14px', marginBottom: 16, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10B981', borderRadius: 8, color: '#10B981', fontSize: '0.85rem', fontWeight: 600 }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Roster Setup & Slots */}
        <div
          style={{
            background: '#0E131E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Team Name</label>
            <input
              type="text"
              className="input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name..."
              maxLength={40}
              style={{ width: '100%', height: 36, fontSize: '0.88rem', padding: '0 10px', background: '#090D14' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Format</label>
            <select
              className="input"
              value={teamFormat}
              onChange={(e) => setTeamFormat(e.target.value)}
              style={{ width: '100%', height: 36, fontSize: '0.82rem', padding: '0 10px', background: '#090D14' }}
            >
              <option value="ou_6v6">[OU] 6v6 Standard Roster</option>
              <option value="blitz_3v3">[Blitz] 3v3 Fast Combat</option>
              <option value="quick_1v1">[Quick] 1v1 Solo Duel</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Roster Slots ({slots.length}/6)
              </span>
              {slots.length > 0 && (
                <button
                  onClick={() => { setSlots([]); setActiveSlotIdx(null); }}
                  style={{ background: 'none', border: 'none', color: '#F87171', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear All
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 140 }}>
              {slots.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No fighters equipped.<br/>Click a champion on the right to add to your roster.
                </div>
              ) : (
                slots.map((slot, idx) => {
                  const c = charsById.get(slot.characterId);
                  const r = allRelics.find(rel => rel.id === slot.relicId);
                  const isSel = idx === activeSlotIdx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveSlotIdx(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: isSel ? '#1E293B' : '#131926',
                        border: isSel ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FighterSprite id={slot.characterId} size="sm" active={isSel} />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFF' }}>
                            {c?.name || slot.characterId}
                            {idx === 0 && <span style={{ marginLeft: 6, fontSize: '0.65rem', padding: '1px 5px', background: 'rgba(99, 102, 241, 0.2)', color: '#818CF8', borderRadius: 4, fontWeight: 700 }}>LEAD</span>}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {r ? r.name : 'No Relic'} · {slot.moveIds.length}/4 Moves
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSlot(idx); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px' }}
                        title="Remove fighter"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cloud Saved Teams */}
          <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Saved Cloud Teams</span>
            {!token ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Login to sync rosters across devices.</span>
            ) : teams.length === 0 ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No saved teams yet.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                {teams.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: '#131926', borderRadius: 6 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleLoadTeam(t)} style={{ padding: '2px 8px', fontSize: '0.72rem', background: '#1E293B', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', borderRadius: 4, cursor: 'pointer' }}>Load</button>
                      <button onClick={() => handleDeleteTeam(t.id)} style={{ padding: '2px 6px', fontSize: '0.72rem', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>Del</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Fighter Editor & Available Roster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Active Fighter Customization Panel */}
          {activeSlot && activeChar ? (
            <div
              style={{
                background: '#101522',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <FighterSprite id={activeChar.id} size="lg" />
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent)', fontWeight: 700 }}>
                      Configuring Slot #{activeSlotIdx! + 1}
                    </span>
                    <h3 style={{ margin: '2px 0', fontSize: '1.4rem', fontWeight: 800, color: '#FFF' }}>{activeChar.name}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{activeChar.title}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-primary)', background: '#0A0D14', padding: '4px 10px', borderRadius: 6 }}>
                      <span><strong>HP:</strong> {activeChar.baseStats.maxHp}</span>
                      <span><strong>ATK:</strong> {activeChar.baseStats.attack}</span>
                      <span><strong>DEF:</strong> {activeChar.baseStats.defense}</span>
                      <span><strong>SPD:</strong> {activeChar.baseStats.speed}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSlotIdx(null)}
                  style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#1E293B', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                >
                  Done Editing
                </button>
              </div>

              {/* Relic Selection */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Held Anime Relic (Item)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {allRelics.map((r) => {
                    const isEq = activeSlot.relicId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => selectRelic(activeSlotIdx!, r.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: isEq ? '#1E293B' : '#0D111C',
                          border: isEq ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isEq ? '#FFF' : 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{r.name}</span>
                          {isEq && <span style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>✔</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.3 }}>{r.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Move Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Select Moves (Choose up to 4 — currently {activeSlot.moveIds.length}/4)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {availableMovesForActive.map((m) => {
                    const isSel = activeSlot.moveIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMoveInSlot(activeSlotIdx!, m.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: isSel ? 'rgba(16, 185, 129, 0.12)' : '#0D111C',
                          border: isSel ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSel ? '#FFF' : 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{m.name}</span>
                          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: m.type === 'physical' ? '#F59E0B' : m.type === 'special' ? '#38BDF8' : '#8B5CF6' }}>{m.type}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.3 }}>{m.description}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
                          Cost: {m.energyCost} ENG {m.power ? `· Pwr: ${m.power}` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {/* Roster Picker */}
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>
              Available Anime Champions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {roster.map((char) => (
                <div
                  key={char.id}
                  onClick={() => addFighterToTeam(char.id)}
                  className="roster-card"
                  style={{
                    background: '#101522',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <FighterSprite id={char.id} size="md" />
                  <div style={{ marginTop: 10, width: '100%' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFF' }}>{char.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>{char.title}</div>
                    <div style={{ marginTop: 8, fontSize: '0.75rem', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px', borderRadius: 4 }}>
                      + Add to Roster
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Showdown Import/Export Modal */}
      {showImportExport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#111622', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 10, padding: 24, width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFF' }}>Showdown Text Import / Export</h3>
              <button onClick={() => setShowImportExport(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>
            <textarea
              className="input"
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Kaze @ Senzu Bean\n- Basic Attack\n- Poison Strike\n\nRyuu @ Berserk Seal\n- Dragon Fist`}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', width: '100%', padding: 12, background: '#080C14', color: '#FFF', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowImportExport(false)} style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#1E293B', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button
                onClick={() => handleImportShowdownText(importText)}
                style={{ padding: '8px 20px', fontSize: '0.82rem', background: 'var(--accent, #6366F1)', border: 'none', color: '#FFF', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}
              >
                Import Roster
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
