import React from 'react';
import type { Move } from '../types';

interface MoveButtonProps {
  move: Move;
  currentEnergy: number;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  physical: 'physical',
  special: 'special',
  status: 'status',
  self: 'self',
};

const POWER_LABEL: Record<string, string> = {
  physical: 'PWR',
  special: 'PWR',
  status: 'EFFECT',
  self: 'BUFF',
};

export const MoveButton: React.FC<MoveButtonProps> = ({
  move,
  currentEnergy,
  isSelected,
  isDisabled,
  onClick,
}) => {
  const canAfford = currentEnergy >= move.energyCost;
  const effectivelyDisabled = isDisabled || !canAfford;

  return (
    <button
      id={`move-btn-${move.id}`}
      className={`move-btn ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      disabled={effectivelyDisabled}
      title={move.description}
    >
      <div className="flex items-center justify-between w-full gap-2">
        <span className="move-btn-name">{move.name}</span>
        <span className={`move-type-badge move-type-${move.type}`}>
          {TYPE_LABELS[move.type]}
        </span>
      </div>

      <div className="move-btn-meta">
        {move.power !== undefined && (
          <span>{POWER_LABEL[move.type]}: {move.power}</span>
        )}
        {move.statusEffect && (
          <span style={{ color: `var(--color-${move.statusEffect.effect})` }}>
            {move.statusEffect.effect} {Math.round(move.statusEffect.chance * 100)}%
          </span>
        )}
        {move.statModifier && (
          <span style={{ color: 'var(--hp-high)' }}>
            +{Math.round((move.statModifier.multiplier - 1) * 100)}% {move.statModifier.stat}
          </span>
        )}
        <span
          className="energy-cost"
          style={{ marginLeft: 'auto', opacity: canAfford ? 1 : 0.4 }}
        >
          ⚡ {move.energyCost}
        </span>
      </div>

      {!canAfford && !isDisabled && (
        <span style={{ fontSize: '0.7rem', color: 'var(--hp-low)' }}>Not enough energy</span>
      )}
    </button>
  );
};
