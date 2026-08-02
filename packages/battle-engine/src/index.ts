export { resolveTurn, createInitialBattleState } from './turnResolver';
export { calculateDamage, getEffectiveAttack, getEffectiveSpeed, rollStatusEffect } from './damage';
export { applyStatusEffect, applyStatModifier, tickStatusEffects, isStunned } from './statusEffects';
export type { MoveWithData, CharacterWithMoves, MoveApplicationResult } from './types';
