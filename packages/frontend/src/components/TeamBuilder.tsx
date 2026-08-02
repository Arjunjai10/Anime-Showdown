import React, { useEffect, useState } from 'react';
import type { Character, TeamDoc } from '../types';
import { CharacterCard } from './CharacterCard';

interface TeamBuilderProps {
  token: string | null;
}

export const TeamBuilder: React.FC<TeamBuilderProps> = ({ token }) => {
  const [roster, setRoster] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teams, setTeams] = useState<TeamDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/roster').then(r => r.json()),
      token ? fetch('/api/teams', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()) : Promise.resolve([]),
    ])
      .then(([chars, userTeams]) => {
        setRoster(chars);
        setTeams(userTeams);
      })
      .catch(() => setError('Failed to load roster'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSaveTeam() {
    if (!selectedCharId || !teamName.trim() || !token) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: teamName.trim(), characterIds: [selectedCharId] }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const team: TeamDoc = await res.json();
      setTeams(prev => [...prev, team]);
      setSuccess(`Team "${team.name}" saved!`);
      setTeamName('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save team');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTeam(id: string) {
    if (!token) return;
    await fetch(`/api/teams/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setTeams(prev => prev.filter(t => t.id !== id));
  }

  if (loading) {
    return (
      <div className="queue-overlay">
        <div className="queue-spinner" />
        <span className="text-secondary">Loading roster…</span>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <h2 style={{ marginBottom: 8 }}>Team Builder</h2>
      <p className="text-secondary" style={{ marginBottom: 32, fontSize: '0.9rem' }}>
        Select a character to field. Only the first character is used in battle (v1 — multi-character teams coming later).
      </p>

      {/* Roster grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {roster.map(char => (
          <CharacterCard
            key={char.id}
            character={char}
            isSelected={selectedCharId === char.id}
            onClick={() => setSelectedCharId(prev => prev === char.id ? null : char.id)}
          />
        ))}
      </div>

      {/* Save team form — only shown when a character is selected */}
      {selectedCharId && token && (
        <div className="glass-elevated" style={{ padding: 24, maxWidth: 420, marginBottom: 32 }}>
          <h3 style={{ marginBottom: 16 }}>Save as Team</h3>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="team-name-input">Team Name</label>
            <input
              id="team-name-input"
              className="input"
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="My team name…"
              maxLength={30}
            />
          </div>
          {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
          {success && (
            <p style={{ color: 'var(--hp-high)', fontSize: '0.85rem', marginBottom: 12 }}>{success}</p>
          )}
          <button
            id="save-team-btn"
            className="btn btn-primary w-full"
            onClick={handleSaveTeam}
            disabled={!teamName.trim() || saving}
          >
            {saving ? 'Saving…' : 'Save Team'}
          </button>
        </div>
      )}

      {!token && (
        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: 32 }}>
          Log in to save teams.
        </p>
      )}

      {/* Saved teams list */}
      {teams.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 16 }}>Your Teams</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teams.map(team => (
              <div
                key={team.id}
                className="glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                }}
              >
                <div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{team.name}</span>
                  <span className="text-muted" style={{ marginLeft: 12, fontSize: '0.8rem' }}>
                    {team.characterIds.join(', ')}
                  </span>
                </div>
                <button
                  id={`delete-team-${team.id}`}
                  className="btn btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => handleDeleteTeam(team.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
