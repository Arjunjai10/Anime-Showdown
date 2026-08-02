export { resolveTurn, createInitialBattleState, switchActiveFighter, syncPlayerFromActive } from './turnResolver';
export { calculateDamage, getEffectiveAttack, getEffectiveSpeed, rollStatusEffect } from './damage';
export { applyStatusEffect, applyStatModifier, tickStatusEffects, isStunned } from './statusEffects';
export { applyRelicToAttack, applyRelicToDodge, applyRelicToDamageTaken, applyRelicAfterDamage, applyRelicEndTurn } from './relics';
export type { MoveWithData, CharacterWithMoves, MoveApplicationResult, FighterSpec } from './types';
