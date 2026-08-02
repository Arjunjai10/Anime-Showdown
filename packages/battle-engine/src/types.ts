/**
 * Engine-internal types that extend shared-types with battle-engine specifics.
 * These are NOT exported from the package — they're internal helpers only.
 */

import type { Move, Character } from '@anime-showdown/shared-types';

/** A move with its full data resolved (from the moves registry). */
export interface MoveWithData extends Move {
  // Currently the same shape — this alias exists so the engine can evolve
  // internal fields without touching shared-types
}

/** A character with its full move data resolved. */
export interface CharacterWithMoves extends Character {
  moves: MoveWithData[];
}

/** Result of a single move application */
export interface MoveApplicationResult {
  damage: number;
  isCrit: boolean;
  missed: boolean;
}
