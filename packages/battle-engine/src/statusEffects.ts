import type {
  BattleFighterState,
  BattleLogEntry,
  ActiveStatModifier,
  StatKey,
} from '@anime-showdown/shared-types';

// ─── Apply status effect ───────────────────────────────────────────────────────

/**
 * Applies a new status effect to a fighter. If the effect is already active,
 * refreshes its duration to the longer of the two values.
 *
 * Pure — returns a new BattleFighterState, never mutates.
 */
export function applyStatusEffect(
  fighter: BattleFighterState,
  effect: 'poison' | 'burn' | 'stun' | 'slow',
  duration: number,
): BattleFighterState {
  const existing = fighter.statusEffects.find(e => e.type === effect);
  if (existing) {
    return {
      ...fighter,
      statusEffects: fighter.statusEffects.map(e =>
        e.type === effect
          ? { ...e, turnsRemaining: Math.max(e.turnsRemaining, duration) }
          : e,
      ),
    };
  }
  return {
    ...fighter,
    statusEffects: [...fighter.statusEffects, { type: effect, turnsRemaining: duration }],
  };
}

// ─── Apply stat modifier ───────────────────────────────────────────────────────

/**
 * Applies a stat modifier to a fighter (e.g. Power Surge boosting attack by 1.5×).
 * Stacks multiplicatively with existing modifiers on the same stat.
 *
 * Pure — returns a new BattleFighterState, never mutates.
 */
export function applyStatModifier(
  fighter: BattleFighterState,
  stat: StatKey,
  multiplier: number,
  duration: number,
): BattleFighterState {
  const newMod: ActiveStatModifier = { stat, multiplier, turnsRemaining: duration };
  const newStats = { ...fighter.stats };
  (newStats[stat] as number) = Math.floor((newStats[stat] as number) * multiplier);

  return {
    ...fighter,
    stats: newStats,
    statModifiers: [...fighter.statModifiers, newMod],
  };
}

// ─── Tick status effects ───────────────────────────────────────────────────────

/**
 * Ticks all active status effects for a fighter at the end of a turn:
 * - Poison/burn deal HP damage
 * - Decrements turn counters
 * - Removes expired effects (restores any stored stat mods for expired effects)
 *
 * Pure — returns new state and new log entries, never mutates.
 */
export function tickStatusEffects(
  fighter: BattleFighterState,
  turn: number,
): { fighter: BattleFighterState; entries: BattleLogEntry[] } {
  const entries: BattleLogEntry[] = [];
  let updatedHp = fighter.currentHp;

  for (const eff of fighter.statusEffects) {
    if (eff.type === 'poison') {
      const damage = Math.max(1, Math.floor(fighter.maxHp * 0.05));
      updatedHp = Math.max(0, updatedHp - damage);
      entries.push({
        turn,
        actorId: fighter.characterId,
        actorName: fighter.name,
        action: 'writhes in poison',
        damage,
      });
    } else if (eff.type === 'burn') {
      const damage = Math.max(1, Math.floor(fighter.maxHp * 0.08));
      updatedHp = Math.max(0, updatedHp - damage);
      entries.push({
        turn,
        actorId: fighter.characterId,
        actorName: fighter.name,
        action: 'suffers burn damage',
        damage,
      });
    }
  }

  // Decrement turns, remove expired, restore stats for expired stat-affecting effects
  const expiring = fighter.statusEffects.filter(e => e.turnsRemaining <= 1);
  const remaining = fighter.statusEffects
    .filter(e => e.turnsRemaining > 1)
    .map(e => ({ ...e, turnsRemaining: e.turnsRemaining - 1 }));

  // Expire stat modifiers whose duration ran out
  const expiringMods = fighter.statModifiers.filter(m => m.turnsRemaining <= 1);
  const remainingMods = fighter.statModifiers
    .filter(m => m.turnsRemaining > 1)
    .map(m => ({ ...m, turnsRemaining: m.turnsRemaining - 1 }));

  // Recompute stats from base + remaining modifiers
  let restoredStats = { ...fighter.baseStats };
  for (const mod of remainingMods) {
    (restoredStats[mod.stat] as number) = Math.floor(
      (restoredStats[mod.stat] as number) * mod.multiplier,
    );
  }

  for (const exp of expiring) {
    entries.push({
      turn,
      actorId: fighter.characterId,
      actorName: fighter.name,
      action: `recovered from ${exp.type}`,
    });
  }

  for (const mod of expiringMods) {
    entries.push({
      turn,
      actorId: fighter.characterId,
      actorName: fighter.name,
      action: `${mod.stat} boost wore off`,
    });
  }

  return {
    fighter: {
      ...fighter,
      currentHp: updatedHp,
      stats: restoredStats,
      statusEffects: remaining,
      statModifiers: remainingMods,
    },
    entries,
  };
}

// ─── Stun check ────────────────────────────────────────────────────────────────

/** Returns true if the fighter is stunned and must skip their action this turn. */
export function isStunned(fighter: BattleFighterState): boolean {
  return fighter.statusEffects.some(e => e.type === 'stun');
}
