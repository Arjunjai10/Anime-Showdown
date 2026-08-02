/**
 * Engine-internal types that extend shared-types with battle-engine specifics.
 * These are NOT exported from the package — they're internal helpers only.
 */

import type { Move, Character, PlayerBattleState, BattleFighterState } from '@anime-showdown/shared-types';

/** A move with its full data resolved (from the moves registry). */
export interface MoveWithData extends Move {}

/** A character with its full move data resolved. */
export interface CharacterWithMoves extends Character {
  moves: MoveWithData[];
}

/** Result of a single move application */
export interface MoveApplicationResult {
  damage: number;
  isCrit: boolean;
  missed: boolean;
  relicLog?: string;
  relicUsed?: boolean;
}

export interface FighterSpec {
  id: string;
  name: string;
  baseStats: {
    maxHp: number;
    maxEnergy: number;
    attack: number;
    defense: number;
    special: number;
    speed: number;
  };
  moveIds: string[];
  relicId?: string;
}
