import React from 'react';
import type { Character, Move } from '../types';

interface CharacterCardProps {
  character: Character & { moves?: Move[] };
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

/** Emoji avatar per archetype — replaced with actual sprites in a later phase */
const ARCHETYPE_EMOJI: Record<string, string> = {
  'Ninja / Speed':        '🥷',
  'Fighter / Power':      '🔥',
  'Warrior / Tank':       '🛡️',
  'Mage / Elemental':     '⚡',
  'Brawler / Electric':   '👊',
  'Assassin / Shadow':    '🗡️',
  'Dark Mage / Curse':    '🔮',
  'Berserker / Wild':     '🌪️',
};

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
  const emoji = ARCHETYPE_EMOJI[character.archetype] ?? '⚔️';

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
      {/* Avatar */}
      <div
        className="character-card-avatar"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${character.colorScheme.primary}40 0%, transparent 70%)`,
        }}
      >
        <div className="fighter-sprite-inner" style={{ fontSize: compact ? '2.5rem' : '3.5rem' }}>
          {emoji}
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
