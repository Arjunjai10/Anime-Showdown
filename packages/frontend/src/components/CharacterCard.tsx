import React from 'react';
import type { Character, Move } from '../types';
import { FighterLogo } from './FighterLogo';

interface CharacterCardProps {
  character: Character & { moves?: Move[] };
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const STAT_LABELS: Array<{ key: keyof Character['baseStats']; label: string }> = [
  { key: 'maxHp',   label: 'HP' },
  { key: 'attack',  label: 'ATK' },
  { key: 'defense', label: 'DEF' },
  { key: 'special', label: 'SPC' },
  { key: 'speed',   label: 'SPD' },
];

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected = false,
  onClick,
  compact = false,
}) => {
  return (
    <div
      id={`character-card-${character.id}`}
      className={`character-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ['--card-gradient' as string]: `linear-gradient(135deg, ${character.colorScheme.primary}33, transparent)`,
      }}
      role={onClick ? 'button' : undefined}
      aria-pressed={onClick ? isSelected : undefined}
      aria-label={`${character.name}, ${character.title}`}
    >
      {/* Avatar Logo */}
      <div
        className="character-card-avatar"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${character.colorScheme.primary}40 0%, transparent 70%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="fighter-sprite-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FighterLogo id={character.id} size={compact ? 48 : 64} color={character.colorScheme.primary} />
        </div>

        {/* Glow ring when selected */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              inset: 8,
              borderRadius: '50%',
              boxShadow: `0 0 30px ${character.colorScheme.primary}80`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="character-card-body">
        <div className="character-card-name" style={{ color: character.colorScheme.primary }}>
          {character.name}
        </div>
        <div className="character-card-title">{character.title}</div>

        {!compact && (
          <>
            {/* Stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', marginBottom: 10 }}>
              {STAT_LABELS.map(({ key, label }) => (
                <div key={key} className="stat-row">
                  <span>{label}</span>
                  <span className="stat-value">{character.baseStats[key]}</span>
                </div>
              ))}
            </div>

            {/* Archetype badge */}
            <div
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: `${character.colorScheme.primary}20`,
                color: character.colorScheme.secondary,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {character.archetype}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
