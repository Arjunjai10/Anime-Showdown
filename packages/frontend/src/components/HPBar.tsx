import React from 'react';
import type { BattleFighterState } from '../types';

interface HPBarProps {
  fighter: BattleFighterState;
  label?: string;
  flip?: boolean; // flip layout for opponent (right-aligned)
}

function getHpClass(current: number, max: number): string {
  const pct = current / max;
  if (pct > 0.5) return 'bar-fill-hp-high';
  if (pct > 0.25) return 'bar-fill-hp-mid';
  return 'bar-fill-hp-low';
}

export const HPBar: React.FC<HPBarProps> = ({ fighter, flip = false }) => {
  const hpPct = Math.max(0, (fighter.currentHp / fighter.maxHp) * 100);
  const enPct = Math.max(0, (fighter.currentEnergy / fighter.maxEnergy) * 100);
  const hpClass = getHpClass(fighter.currentHp, fighter.maxHp);

  return (
    <div className="glass p-4" style={{ minWidth: 240 }}>
      {/* Name */}
      <div
        className="flex justify-between items-center"
        style={{ flexDirection: flip ? 'row-reverse' : 'row', marginBottom: 8 }}
      >
        <span
          className="character-card-name"
          style={{ fontSize: '1rem' }}
        >
          {fighter.name}
        </span>
        <span
          className="stat-value"
          style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
        >
          {fighter.currentHp} / {fighter.maxHp}
        </span>
      </div>

      {/* HP bar */}
      <div style={{ marginBottom: 6 }}>
        <div className="bar-track">
          <div
            className={`bar-fill ${hpClass}`}
            style={{ width: `${hpPct}%` }}
            role="progressbar"
            aria-valuenow={fighter.currentHp}
            aria-valuemin={0}
            aria-valuemax={fighter.maxHp}
            aria-label="HP"
          />
        </div>
      </div>

      {/* Energy bar */}
      <div
        className="flex items-center gap-2"
        style={{ flexDirection: flip ? 'row-reverse' : 'row' }}
      >
        <span style={{ fontSize: '0.7rem', color: 'var(--energy-color)', minWidth: 20 }}>EN</span>
        <div className="bar-track" style={{ height: 4 }}>
          <div
            className="bar-fill bar-fill-energy"
            style={{ width: `${enPct}%`, height: '100%' }}
            role="progressbar"
            aria-valuenow={fighter.currentEnergy}
            aria-valuemin={0}
            aria-valuemax={fighter.maxEnergy}
            aria-label="Energy"
          />
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: 24 }}>
          {fighter.currentEnergy}
        </span>
      </div>

      {/* Status effects */}
      {fighter.statusEffects.length > 0 && (
        <div className="status-badges" style={{ marginTop: 8 }}>
          {fighter.statusEffects.map(eff => (
            <span key={eff.type} className={`status-badge status-${eff.type}`}>
              {eff.type} ×{eff.turnsRemaining}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
