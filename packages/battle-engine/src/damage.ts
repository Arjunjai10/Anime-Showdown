import type { BattleFighterState, StatusEffectType } from '@anime-showdown/shared-types';
import type { MoveWithData, MoveApplicationResult } from './types';
import { applyRelicToAttack, applyRelicToDodge, applyRelicToDamageTaken } from './relics';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CRIT_CHANCE = 0.1;
const CRIT_MULTIPLIER = 1.5;
const RANDOM_MIN = 0.85;
const RANDOM_MAX = 1.0;

// ─── Effective stat helpers ─────────────────────────────────────────────────────

/**
 * Returns the effective attack (or special attack) stat for a fighter,
 * accounting for burn debuff and relics WITHOUT mutating the stored stats object.
 */
export function getEffectiveAttack(fighter: BattleFighterState, moveType: 'physical' | 'special'): number {
  const base = moveType === 'special' ? fighter.stats.special : fighter.stats.attack;
  const hasBurn = fighter.statusEffects.some(e => e.type === 'burn');
  let effective = hasBurn ? Math.floor(base * 0.75) : base;
  return applyRelicToAttack(fighter, effective, moveType);
}

/**
 * Returns the effective speed for a fighter, accounting for slow debuff.
 */
export function getEffectiveSpeed(fighter: BattleFighterState): number {
  const hasSlow = fighter.statusEffects.some(e => e.type === 'slow');
  return hasSlow ? Math.floor(fighter.stats.speed * 0.5) : fighter.stats.speed;
}

// ─── Damage calculation ────────────────────────────────────────────────────────

/**
 * Pure damage calculation — no mutations, no I/O.
 */
export function calculateDamage(
  attacker: BattleFighterState,
  move: MoveWithData,
  defender: BattleFighterState,
): MoveApplicationResult {
  // Accuracy check & Dodge relic check
  if (Math.floor(Math.random() * 100) >= move.accuracy || applyRelicToDodge(defender)) {
    return { damage: 0, isCrit: false, missed: true };
  }

  if (move.power === undefined || move.type === 'status' || move.type === 'self') {
    return { damage: 0, isCrit: false, missed: false };
  }

  const attackStat = getEffectiveAttack(attacker, move.type as 'physical' | 'special');
  const defenseStat = defender.stats.defense;

  const isCrit = Math.random() < CRIT_CHANCE;
  const critMult = isCrit ? CRIT_MULTIPLIER : 1.0;
  const randomFactor = RANDOM_MIN + Math.random() * (RANDOM_MAX - RANDOM_MIN);

  let rawDamage = Math.max(
    1,
    Math.floor(move.power * (attackStat / defenseStat) * critMult * randomFactor),
  );

  // Apply defensive relics (Dragon Scale, Warrior's Resolve)
  const relicMod = applyRelicToDamageTaken(defender, rawDamage, move.type);

  return {
    damage: relicMod.damage,
    isCrit,
    missed: false,
    relicLog: relicMod.logMessage,
    relicUsed: relicMod.relicUsed,
  };
}

/**
 * Rolls whether a move's status effect is applied this turn.
 */
export function rollStatusEffect(
  effectChance: number,
  targetHasEffect: (type: StatusEffectType) => boolean,
  effectType: StatusEffectType,
): boolean {
  if (targetHasEffect(effectType)) return false; // Don't re-apply same effect
  return Math.random() < effectChance;
}
