import type {
  BattleState,
  BattleFighterState,
  PlayerBattleState,
  BattleAction,
  BattleLogEntry,
  PlayerKey,
} from '@anime-showdown/shared-types';
import type { MoveWithData, FighterSpec } from './types';
import { calculateDamage, rollStatusEffect, getEffectiveSpeed } from './damage';
import { applyStatusEffect, applyStatModifier, tickStatusEffects, isStunned } from './statusEffects';
import { applyRelicAfterDamage, applyRelicEndTurn } from './relics';

// ─── Helper: synchronize top-level active properties and team array ───────────

export function syncPlayerFromActive(player: PlayerBattleState, active: BattleFighterState): PlayerBattleState {
  const newTeam = player.team.map((f, i) => (i === player.activeIdx ? { ...active, isAlive: active.currentHp > 0 } : f));
  return {
    ...player,
    ...active,
    team: newTeam,
  };
}

/**
 * Switches a player's active fighter to the target bench index.
 */
export function switchActiveFighter(
  player: PlayerBattleState,
  newIndex: number,
): { player: PlayerBattleState; success: boolean } {
  if (newIndex < 0 || newIndex >= player.team.length || player.team[newIndex].currentHp <= 0 || newIndex === player.activeIdx) {
    return { player, success: false };
  }
  const newActive = player.team[newIndex];
  return {
    player: {
      ...player,
      ...newActive,
      activeIdx: newIndex,
      mustSwitch: false,
    },
    success: true,
  };
}

// ─── Turn resolution ───────────────────────────────────────────────────────────

export function resolveTurn(
  state: BattleState,
  actionA: BattleAction,
  actionB: BattleAction,
  moveLookup: (id: string) => MoveWithData | undefined,
): BattleState {
  let playerA: PlayerBattleState = { ...state.playerA };
  let playerB: PlayerBattleState = { ...state.playerB };
  const newLog: BattleLogEntry[] = [];
  const turn = state.turn + 1;

  // 1) Handle 'switching' phase (forced replacement after a KO)
  if (state.phase === 'switching') {
    if (playerA.mustSwitch) {
      const idx = actionA.switchIndex !== undefined ? actionA.switchIndex : playerA.team.findIndex(f => f.currentHp > 0);
      const res = switchActiveFighter(playerA, idx);
      if (res.success) {
        playerA = res.player;
        newLog.push({
          turn,
          actorId: playerA.characterId,
          actorName: playerA.name,
          action: `was sent out into battle!`,
        });
      }
    }
    if (playerB.mustSwitch) {
      const idx = actionB.switchIndex !== undefined ? actionB.switchIndex : playerB.team.findIndex(f => f.currentHp > 0);
      const res = switchActiveFighter(playerB, idx);
      if (res.success) {
        playerB = res.player;
        newLog.push({
          turn,
          actorId: playerB.characterId,
          actorName: playerB.name,
          action: `was sent out into battle!`,
        });
      }
    }
    return {
      ...state,
      phase: 'selecting',
      playerA,
      playerB,
      log: [...state.log, ...newLog],
    };
  }

  // 2) Regular Combat Phase — Process switches first (highest priority)
  if (actionA.type === 'switch' && actionA.switchIndex !== undefined) {
    const oldName = playerA.name;
    const res = switchActiveFighter(playerA, actionA.switchIndex);
    if (res.success) {
      playerA = res.player;
      newLog.push({
        turn,
        actorId: playerA.characterId,
        actorName: playerA.name,
        action: `withdrew ${oldName} and sent out ${playerA.name}!`,
      });
    }
  }

  if (actionB.type === 'switch' && actionB.switchIndex !== undefined) {
    const oldName = playerB.name;
    const res = switchActiveFighter(playerB, actionB.switchIndex);
    if (res.success) {
      playerB = res.player;
      newLog.push({
        turn,
        actorId: playerB.characterId,
        actorName: playerB.name,
        action: `withdrew ${oldName} and sent out ${playerB.name}!`,
      });
    }
  }

  // 3) Determine attack order for players submitting moves
  const moveActions: [PlayerKey, BattleAction][] = [];
  const speedA = getEffectiveSpeed(playerA);
  const speedB = getEffectiveSpeed(playerB);

  let firstKey: PlayerKey = speedA > speedB ? 'playerA' : speedB > speedA ? 'playerB' : (Math.random() < 0.5 ? 'playerA' : 'playerB');
  let secondKey: PlayerKey = firstKey === 'playerA' ? 'playerB' : 'playerA';

  const orderedKeys = [firstKey, secondKey];
  for (const k of orderedKeys) {
    const act = k === 'playerA' ? actionA : actionB;
    if (!act.type || act.type === 'move') {
      if (act.moveId) moveActions.push([k, act]);
    }
  }

  // 4) Execute attacking actions
  for (const [actorKey, action] of moveActions) {
    let actor: PlayerBattleState = actorKey === 'playerA' ? playerA : playerB;
    let target: PlayerBattleState = actorKey === 'playerA' ? playerB : playerA;

    // Stun check
    if (isStunned(actor)) {
      newLog.push({
        turn,
        actorId: actor.characterId,
        actorName: actor.name,
        action: 'is stunned and cannot move!',
      });
      const updatedActor = {
        ...actor,
        statusEffects: actor.statusEffects.filter(e => e.type !== 'stun'),
      };
      if (actorKey === 'playerA') playerA = syncPlayerFromActive(playerA, updatedActor);
      else playerB = syncPlayerFromActive(playerB, updatedActor);
      continue;
    }

    if (action.moveId === 'recharge' || action.moveId === 'regain_energy') {
      const regained = 50;
      const newEng = Math.min(actor.maxEnergy, actor.currentEnergy + regained);
      const actualGain = newEng - actor.currentEnergy;
      const updatedActor: BattleFighterState = {
        ...actor,
        currentEnergy: newEng,
      };
      newLog.push({
        turn,
        actorId: actor.characterId,
        actorName: actor.name,
        action: `focused internal energy and spirit to regain +${actualGain} Energy! ⚡`,
      });
      if (actorKey === 'playerA') playerA = syncPlayerFromActive(playerA, updatedActor);
      else playerB = syncPlayerFromActive(playerB, updatedActor);
      continue;
    }

    const move = moveLookup(action.moveId!);
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
    let updatedActor: BattleFighterState = {
      ...actor,
      currentEnergy: actor.currentEnergy - move.energyCost,
    };
    let updatedTarget: BattleFighterState = { ...target };

    // Multi-hit moves hit twice
    const hitCount = move.tags?.includes('multi-hit') ? 2 : 1;
    let totalDamage = 0;
    let didMiss = false;
    let didCrit = false;
    let anyRelicLog: string | undefined;

    for (let i = 0; i < hitCount; i++) {
      const result = calculateDamage(updatedActor, move, updatedTarget);
      if (result.missed) {
        didMiss = true;
        break;
      }
      totalDamage += result.damage;
      didCrit = didCrit || result.isCrit;
      if (result.relicLog) anyRelicLog = result.relicLog;
      if (result.relicUsed !== undefined) updatedTarget.relicUsed = result.relicUsed;
      updatedTarget = {
        ...updatedTarget,
        currentHp: Math.max(0, updatedTarget.currentHp - result.damage),
      };
    }

    if (anyRelicLog) {
      newLog.push({ turn, actorId: target.characterId, actorName: target.name, action: anyRelicLog });
    }

    // Self-buff moves
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
      if (move.type === 'status' && move.statusEffect) {
        const applied = rollStatusEffect(
          move.statusEffect.chance,
          (t) => updatedTarget.statusEffects.some(e => e.type === t),
          move.statusEffect.effect,
        );
        if (applied) {
          updatedTarget = applyStatusEffect(updatedTarget, move.statusEffect.effect, move.statusEffect.duration);
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

        if (move.statusEffect && totalDamage > 0) {
          const applied = rollStatusEffect(
            move.statusEffect.chance,
            (t) => updatedTarget.statusEffects.some(e => e.type === t),
            move.statusEffect.effect,
          );
          if (applied) {
            updatedTarget = applyStatusEffect(updatedTarget, move.statusEffect.effect, move.statusEffect.duration);
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

    // Trigger post-damage relics (e.g., Senzu Bean heal)
    const afterDmg = applyRelicAfterDamage(updatedTarget);
    if (afterDmg.logMessage) {
      newLog.push({ turn, actorId: updatedTarget.characterId, actorName: updatedTarget.name, action: afterDmg.logMessage });
      updatedTarget = afterDmg.fighter;
    }

    if (actorKey === 'playerA') {
      playerA = syncPlayerFromActive(playerA, updatedActor);
      playerB = syncPlayerFromActive(playerB, updatedTarget);
    } else {
      playerB = syncPlayerFromActive(playerB, updatedActor);
      playerA = syncPlayerFromActive(playerA, updatedTarget);
    }

    if (playerA.currentHp <= 0 || playerB.currentHp <= 0) break;
  }

  // 5) End of turn — ticks and energy recovery
  const { fighter: tickedA, entries: entriesA } = tickStatusEffects(playerA, turn);
  const { fighter: tickedB, entries: entriesB } = tickStatusEffects(playerB, turn);

  const relicTurnA = applyRelicEndTurn(tickedA);
  const relicTurnB = applyRelicEndTurn(tickedB);

  const finalActiveA = {
    ...relicTurnA.fighter,
    currentEnergy: Math.min(relicTurnA.fighter.maxEnergy, relicTurnA.fighter.currentEnergy + 10),
  };
  const finalActiveB = {
    ...relicTurnB.fighter,
    currentEnergy: Math.min(relicTurnB.fighter.maxEnergy, relicTurnB.fighter.currentEnergy + 10),
  };

  playerA = syncPlayerFromActive(playerA, finalActiveA);
  playerB = syncPlayerFromActive(playerB, finalActiveB);

  // 6) KO checks & Phase determination
  if (playerA.currentHp <= 0 && playerA.team.some(f => f.currentHp > 0)) {
    playerA.mustSwitch = true;
    newLog.push({ turn, actorId: playerA.characterId, actorName: playerA.name, action: 'was knocked out!' });
  }
  if (playerB.currentHp <= 0 && playerB.team.some(f => f.currentHp > 0)) {
    playerB.mustSwitch = true;
    newLog.push({ turn, actorId: playerB.characterId, actorName: playerB.name, action: 'was knocked out!' });
  }

  const aDefeated = !playerA.team.some(f => f.currentHp > 0);
  const bDefeated = !playerB.team.some(f => f.currentHp > 0);

  const winner: BattleState['winner'] =
    aDefeated && bDefeated ? 'draw'
    : aDefeated ? 'playerB'
    : bDefeated ? 'playerA'
    : undefined;

  const phase = winner !== undefined ? 'ended' : (playerA.mustSwitch || playerB.mustSwitch ? 'switching' : 'selecting');

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

export function createInitialBattleState(
  battleId: string,
  charA: FighterSpec | FighterSpec[],
  charB: FighterSpec | FighterSpec[],
  format: string = 'ou_6v6',
): BattleState {
  const makePlayerState = (specs: FighterSpec | FighterSpec[]): PlayerBattleState => {
    const specList = Array.isArray(specs) ? specs : [specs];
    const team: BattleFighterState[] = specList.map(char => ({
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
      relicId: char.relicId,
      isAlive: true,
    }));

    return {
      ...team[0],
      team,
      activeIdx: 0,
    };
  };

  return {
    id: battleId,
    turn: 0,
    phase: 'selecting',
    playerA: makePlayerState(charA),
    playerB: makePlayerState(charB),
    log: [],
    format,
  };
}
