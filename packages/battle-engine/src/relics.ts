import type { BattleFighterState } from '@anime-showdown/shared-types';

/**
 * Pure functions for applying Anime Relic held items during battle resolution.
 * All functions return copies without mutating input state.
 */

/**
 * Modifies attacking stat based on equipped relic.
 */
export function applyRelicToAttack(attacker: BattleFighterState, baseStat: number, moveType: string): number {
  if (attacker.relicId === 'chakra_band' && moveType === 'special') {
    return Math.floor(baseStat * 1.2);
  }
  return baseStat;
}

/**
 * Modifies evasion check (returns true if attack dodged by relic).
 */
export function applyRelicToDodge(target: BattleFighterState): boolean {
  if (target.relicId === 'shadow_cloak') {
    return Math.random() < 0.10; // 10% dodge chance
  }
  return false;
}

/**
 * Modifies damage taken by defender's relics before health deduction.
 */
export function applyRelicToDamageTaken(
  defender: BattleFighterState,
  damage: number,
  moveType: string
): { damage: number; logMessage?: string; relicUsed?: boolean } {
  let finalDamage = damage;
  let logMessage: string | undefined;
  let relicUsed = defender.relicUsed;

  // Dragon Scale: -15% physical damage
  if (defender.relicId === 'dragon_scale' && moveType === 'physical') {
    finalDamage = Math.max(1, Math.floor(finalDamage * 0.85));
  }

  // Warrior's Resolve: survive lethal blow from full HP with 1 HP
  if (
    defender.relicId === 'warriors_resolve' &&
    !defender.relicUsed &&
    defender.currentHp === defender.maxHp &&
    finalDamage >= defender.currentHp
  ) {
    finalDamage = defender.currentHp - 1;
    logMessage = `${defender.name}'s Warrior's Resolve glowed brightly! They survived the lethal hit with 1 HP!`;
    relicUsed = true;
  }

  return { damage: finalDamage, logMessage, relicUsed };
}

/**
 * Triggers low HP items immediately after damage is deducted.
 */
export function applyRelicAfterDamage(defender: BattleFighterState): { fighter: BattleFighterState; logMessage?: string } {
  if (
    defender.relicId === 'senzu_bean' &&
    !defender.relicUsed &&
    defender.currentHp > 0 &&
    defender.currentHp <= Math.floor(defender.maxHp * 0.3)
  ) {
    const healAmount = Math.floor(defender.maxHp * 0.3);
    const newHp = Math.min(defender.maxHp, defender.currentHp + healAmount);
    return {
      fighter: { ...defender, currentHp: newHp, relicUsed: true },
      logMessage: `${defender.name} consumed their Senzu Bean instantly restoring ${healAmount} HP!`,
    };
  }
  return { fighter: defender };
}

/**
 * Triggers end-of-turn recovery relics.
 */
export function applyRelicEndTurn(fighter: BattleFighterState): { fighter: BattleFighterState; bonusEnergy: number } {
  if (fighter.currentHp <= 0) return { fighter, bonusEnergy: 0 };
  
  if (fighter.relicId === 'energy_flask') {
    const bonusEnergy = 15;
    const newEnergy = Math.min(fighter.maxEnergy, fighter.currentEnergy + bonusEnergy);
    return {
      fighter: { ...fighter, currentEnergy: newEnergy },
      bonusEnergy,
    };
  }
  return { fighter, bonusEnergy: 0 };
}
