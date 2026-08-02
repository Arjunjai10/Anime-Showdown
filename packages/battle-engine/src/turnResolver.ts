import type {
  BattleState,
  BattleFighterState,
  BattleAction,
  BattleLogEntry,
  PlayerKey,
} from '@anime-showdown/shared-types';
import type { MoveWithData } from './types';
import { calculateDamage, rollStatusEffect, getEffectiveSpeed } from './damage';
import { applyStatusEffect, applyStatModifier, tickStatusEffects, isStunned } from './statusEffects';

// ─── Turn resolution ───────────────────────────────────────────────────────────

/**
 * The core battle engine function.
 *
 * Takes the current battle state and two actions (one per player),
 * returns a new BattleState reflecting the results of this turn.
 *
 * Contract:
 *  - Pure function — no side effects, no I/O, no mutations
 *  - Input state is never modified
 *  - The server is authoritative: this function is ONLY called server-side
 *
 * @param state - Current immutable battle state
 * @param actionA - Action chosen by playerA
 * @param actionB - Action chosen by playerB
 * @param moveLookup - A function to resolve a move ID → MoveWithData (injected to keep the engine I/O-free)
 */
export function resolveTurn(
  state: BattleState,
  actionA: BattleAction,
  actionB: BattleAction,
  moveLookup: (id: string) => MoveWithData | undefined,
): BattleState {
  let playerA = { ...state.playerA };
  let playerB = { ...state.playerB };
  const newLog: BattleLogEntry[] = [];
  const turn = state.turn + 1;

  // Determine turn order by effective speed (stun skip happens per actor below)
  const speedA = getEffectiveSpeed(playerA);
  const speedB = getEffectiveSpeed(playerB);

  let firstKey: PlayerKey;
  let secondKey: PlayerKey;

  if (speedA > speedB) {
    firstKey = 'playerA';
    secondKey = 'playerB';
  } else if (speedB > speedA) {
    firstKey = 'playerB';
    secondKey = 'playerA';
  } else {
    // Speed tie — random
    const coin = Math.random() < 0.5;
    firstKey = coin ? 'playerA' : 'playerB';
    secondKey = coin ? 'playerB' : 'playerA';
  }

  const orderedActions: [PlayerKey, BattleAction][] = [
    [firstKey, firstKey === 'playerA' ? actionA : actionB],
    [secondKey, secondKey === 'playerA' ? actionA : actionB],
  ];

  for (const [actorKey, action] of orderedActions) {
    const actor: BattleFighterState = actorKey === 'playerA' ? playerA : playerB;
    const target: BattleFighterState = actorKey === 'playerA' ? playerB : playerA;

    // Stun check — skip this actor's action
    if (isStunned(actor)) {
      newLog.push({
        turn,
        actorId: actor.characterId,
        actorName: actor.name,
        action: 'is stunned and cannot move!',
      });
      // Remove stun after 1 turn
      const updatedActor = {
        ...actor,
        statusEffects: actor.statusEffects.filter(e => e.type !== 'stun'),
      };
      if (actorKey === 'playerA') playerA = updatedActor;
      else playerB = updatedActor;
      continue;
    }

    // Energy check — if not enough energy, use Shadow Strike fallback or skip
    const move = moveLookup(action.moveId);
    if (!move) {
      newLog.push({
        turn,
        actorId: actor.characterId,
        actorName: actor.name,
        action: `tried an unknown move (${action.moveId}) — skipped`,
      });
      continue;
    }

    if (actor.currentEnergy < move.energyCost) {
      newLog.push({
        turn,
        actorId: actor.characterId,
        actorName: actor.name,
        action: `doesn't have enough energy for ${move.name}!`,
      });
      continue;
    }

    // Deduct energy
    let updatedActor = {
      ...actor,
      currentEnergy: actor.currentEnergy - move.energyCost,
    };
    let updatedTarget = { ...target };

    // Multi-hit handling (tag: 'multi-hit' — hits twice)
    const hitCount = move.tags?.includes('multi-hit') ? 2 : 1;
    let totalDamage = 0;
    let didMiss = false;
    let didCrit = false;

    for (let i = 0; i < hitCount; i++) {
      const result = calculateDamage(updatedActor, move, updatedTarget);
      if (result.missed) {
        didMiss = true;
        break;
      }
      totalDamage += result.damage;
      didCrit = didCrit || result.isCrit;
      updatedTarget = {
        ...updatedTarget,
        currentHp: Math.max(0, updatedTarget.currentHp - result.damage),
      };
    }

    // Self-buff / stat modifier moves
    if (move.statModifier && move.statModifier.target === 'self') {
      updatedActor = applyStatModifier(
        updatedActor,
        move.statModifier.stat,
        move.statModifier.multiplier,
        move.statModifier.duration,
      );
      newLog.push({
        turn,
        actorId: actor.characterId,
        actorName: actor.name,
        action: `used ${move.name}! ${move.statModifier.stat} rose!`,
      });
    } else if (didMiss) {
      newLog.push({
        turn,
        actorId: actor.characterId,
        actorName: actor.name,
        action: `used ${move.name} — but it missed!`,
        missed: true,
      });
    } else {
      // Status-only moves (no power, targets opponent)
      if (move.type === 'status' && move.statusEffect) {
        const applied = rollStatusEffect(
          move.statusEffect.chance,
          (t) => updatedTarget.statusEffects.some(e => e.type === t),
          move.statusEffect.effect,
        );
        if (applied) {
          updatedTarget = applyStatusEffect(
            updatedTarget,
            move.statusEffect.effect,
            move.statusEffect.duration,
          );
          newLog.push({
            turn,
            actorId: actor.characterId,
            actorName: actor.name,
            action: `used ${move.name}!`,
            statusApplied: move.statusEffect.effect,
          });
        } else {
          newLog.push({
            turn,
            actorId: actor.characterId,
            actorName: actor.name,
            action: `used ${move.name}! But it had no effect.`,
          });
        }
      } else {
        // Damage move log entry
        const hitLabel = hitCount > 1 ? ` (hit ${hitCount}× for ${totalDamage} total)` : '';
        const critLabel = didCrit ? ' Critical hit!' : '';
        newLog.push({
          turn,
          actorId: actor.characterId,
          actorName: actor.name,
          action: `used ${move.name}!${hitLabel}${critLabel}`,
          damage: totalDamage,
          isCrit: didCrit,
        });

        // Roll for secondary status effect on damage moves
        if (move.statusEffect && totalDamage > 0) {
          const applied = rollStatusEffect(
            move.statusEffect.chance,
            (t) => updatedTarget.statusEffects.some(e => e.type === t),
            move.statusEffect.effect,
          );
          if (applied) {
            updatedTarget = applyStatusEffect(
              updatedTarget,
              move.statusEffect.effect,
              move.statusEffect.duration,
            );
            newLog.push({
              turn,
              actorId: actor.characterId,
              actorName: actor.name,
              action: `${updatedTarget.name} was inflicted with ${move.statusEffect.effect}!`,
              statusApplied: move.statusEffect.effect,
            });
          }
        }
      }
    }

    // Write updated actors back
    if (actorKey === 'playerA') {
      playerA = updatedActor;
      playerB = updatedTarget;
    } else {
      playerB = updatedActor;
      playerA = updatedTarget;
    }

    // Early KO check — stop processing actions if someone is already knocked out
    if (playerA.currentHp <= 0 || playerB.currentHp <= 0) break;
  }

  // End of turn — tick status effects for both fighters
  const { fighter: tickedA, entries: entriesA } = tickStatusEffects(playerA, turn);
  const { fighter: tickedB, entries: entriesB } = tickStatusEffects(playerB, turn);
  playerA = tickedA;
  playerB = tickedB;

  // Energy recovery (10 per turn, capped at max)
  playerA = { ...playerA, currentEnergy: Math.min(playerA.maxEnergy, playerA.currentEnergy + 10) };
  playerB = { ...playerB, currentEnergy: Math.min(playerB.maxEnergy, playerB.currentEnergy + 10) };

  // Win condition check
  const aAlive = playerA.currentHp > 0;
  const bAlive = playerB.currentHp > 0;
  const winner: BattleState['winner'] =
    !aAlive && !bAlive ? 'draw'
    : !aAlive ? 'playerB'
    : !bAlive ? 'playerA'
    : undefined;

  const phase = winner !== undefined ? 'ended' : 'selecting';

  return {
    ...state,
    turn,
    phase,
    playerA,
    playerB,
    winner,
    log: [...state.log, ...newLog, ...entriesA, ...entriesB],
  };
}

// ─── Battle state factory ──────────────────────────────────────────────────────

/**
 * Creates the initial BattleState from two characters.
 * The server calls this when a match is made.
 */
export function createInitialBattleState(
  battleId: string,
  charA: { id: string; name: string; baseStats: { maxHp: number; maxEnergy: number; attack: number; defense: number; special: number; speed: number }; moveIds: string[] },
  charB: { id: string; name: string; baseStats: { maxHp: number; maxEnergy: number; attack: number; defense: number; special: number; speed: number }; moveIds: string[] },
): BattleState {
  const makeFighter = (char: typeof charA): BattleFighterState => ({
    characterId: char.id,
    name: char.name,
    currentHp: char.baseStats.maxHp,
    maxHp: char.baseStats.maxHp,
    currentEnergy: char.baseStats.maxEnergy,
    maxEnergy: char.baseStats.maxEnergy,
    stats: {
      attack: char.baseStats.attack,
      defense: char.baseStats.defense,
      special: char.baseStats.special,
      speed: char.baseStats.speed,
    },
    baseStats: {
      attack: char.baseStats.attack,
      defense: char.baseStats.defense,
      special: char.baseStats.special,
      speed: char.baseStats.speed,
    },
    statusEffects: [],
    statModifiers: [],
    moveIds: char.moveIds,
  });

  return {
    id: battleId,
    turn: 0,
    phase: 'selecting',
    playerA: makeFighter(charA),
    playerB: makeFighter(charB),
    log: [],
  };
}
