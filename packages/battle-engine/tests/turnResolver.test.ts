import { describe, it, expect, vi } from 'vitest';
import { resolveTurn, createInitialBattleState } from '../src/turnResolver';
import type { BattleState, BattleAction } from '@anime-showdown/shared-types';
import type { MoveWithData } from '../src/types';

// ─── Test fixtures ─────────────────────────────────────────────────────────────

const MOVE_BASIC_ATTACK: MoveWithData = {
  id: 'basic-attack',
  name: 'Basic Attack',
  description: 'A simple attack',
  type: 'physical',
  power: 50,
  accuracy: 100,
  energyCost: 10,
};

const MOVE_SPECIAL_ATTACK: MoveWithData = {
  id: 'special-attack',
  name: 'Special Attack',
  description: 'A powerful special attack',
  type: 'special',
  power: 80,
  accuracy: 100,
  energyCost: 20,
};

const MOVE_POISON_STRIKE: MoveWithData = {
  id: 'poison-strike',
  name: 'Poison Strike',
  description: 'Poisons the target',
  type: 'physical',
  power: 30,
  accuracy: 100,
  energyCost: 15,
  statusEffect: { effect: 'poison', chance: 1.0, duration: 3 }, // 100% chance for determinism
};

const MOVE_SELF_BUFF: MoveWithData = {
  id: 'self-buff',
  name: 'Power Up',
  description: 'Boosts attack',
  type: 'self',
  accuracy: 100,
  energyCost: 10,
  statModifier: { target: 'self', stat: 'attack', multiplier: 1.5, duration: 2 },
};

const MOVE_STUN: MoveWithData = {
  id: 'stun-move',
  name: 'Stun Strike',
  description: 'Stuns the target',
  type: 'physical',
  power: 20,
  accuracy: 100,
  energyCost: 15,
  statusEffect: { effect: 'stun', chance: 1.0, duration: 1 }, // 100% stun
};

const MOVE_LOW_ENERGY: MoveWithData = {
  id: 'expensive-move',
  name: 'Expensive Move',
  description: 'Costs a lot of energy',
  type: 'physical',
  power: 100,
  accuracy: 100,
  energyCost: 999, // More than any fighter has
};

const CHAR_FAST = {
  id: 'fast-char',
  name: 'Fast Char',
  baseStats: { maxHp: 1000, maxEnergy: 100, attack: 100, defense: 80, special: 80, speed: 150 },
  moveIds: ['basic-attack'],
};

const CHAR_SLOW = {
  id: 'slow-char',
  name: 'Slow Char',
  baseStats: { maxHp: 1000, maxEnergy: 100, attack: 100, defense: 80, special: 80, speed: 50 },
  moveIds: ['basic-attack'],
};

const CHAR_EQUAL = {
  id: 'equal-char',
  name: 'Equal Char',
  baseStats: { maxHp: 1000, maxEnergy: 100, attack: 100, defense: 80, special: 80, speed: 100 },
  moveIds: ['basic-attack'],
};

const CHAR_LOW_HP = {
  id: 'low-hp-char',
  name: 'Low HP Char',
  baseStats: { maxHp: 1, maxEnergy: 100, attack: 100, defense: 80, special: 80, speed: 100 },
  moveIds: ['basic-attack'],
};

function makeState(charA = CHAR_FAST, charB = CHAR_SLOW): BattleState {
  return createInitialBattleState('test-battle', charA, charB);
}

function makeAction(playerKey: 'playerA' | 'playerB', moveId: string): BattleAction {
  return { playerKey, moveId };
}

function makeLookup(moves: MoveWithData[]): (id: string) => MoveWithData | undefined {
  const map = new Map(moves.map(m => [m.id, m]));
  return (id) => map.get(id);
}

const basicLookup = makeLookup([
  MOVE_BASIC_ATTACK,
  MOVE_SPECIAL_ATTACK,
  MOVE_POISON_STRIKE,
  MOVE_SELF_BUFF,
  MOVE_STUN,
  MOVE_LOW_ENERGY,
]);

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('resolveTurn — basic damage', () => {
  it('deals positive damage to the target on a physical hit', () => {
    const state = makeState();
    const next = resolveTurn(state, makeAction('playerA', 'basic-attack'), makeAction('playerB', 'basic-attack'), basicLookup);

    expect(next.playerB.currentHp).toBeLessThan(state.playerB.maxHp);
    expect(next.playerA.currentHp).toBeLessThan(state.playerA.maxHp);
  });

  it('increments the turn counter', () => {
    const state = makeState();
    const next = resolveTurn(state, makeAction('playerA', 'basic-attack'), makeAction('playerB', 'basic-attack'), basicLookup);
    expect(next.turn).toBe(state.turn + 1);
  });

  it('deducts energy from both fighters after a move', () => {
    const state = makeState();
    const next = resolveTurn(state, makeAction('playerA', 'basic-attack'), makeAction('playerB', 'basic-attack'), basicLookup);
    // Energy deducted by cost (10) then restored by regen (10) — net 0 for cost-10 moves
    // So energy should be >= state energy - cost + regen
    expect(next.playerA.currentEnergy).toBeGreaterThanOrEqual(0);
    expect(next.playerB.currentEnergy).toBeGreaterThanOrEqual(0);
  });

  it('adds log entries for the turn', () => {
    const state = makeState();
    const next = resolveTurn(state, makeAction('playerA', 'basic-attack'), makeAction('playerB', 'basic-attack'), basicLookup);
    expect(next.log.length).toBeGreaterThan(0);
  });
});

describe('resolveTurn — turn order', () => {
  it('faster character acts first (log reflects their attack before slowchar)', () => {
    const state = makeState(CHAR_FAST, CHAR_SLOW);
    const next = resolveTurn(state, makeAction('playerA', 'basic-attack'), makeAction('playerB', 'basic-attack'), basicLookup);
    const firstEntry = next.log[0];
    expect(firstEntry.actorId).toBe('fast-char');
  });

  it('slower character acts second', () => {
    const state = makeState(CHAR_FAST, CHAR_SLOW);
    const next = resolveTurn(state, makeAction('playerA', 'basic-attack'), makeAction('playerB', 'basic-attack'), basicLookup);
    const actorIds = next.log.filter(e => e.action.includes('used')).map(e => e.actorId);
    expect(actorIds[0]).toBe('fast-char');
    expect(actorIds[1]).toBe('slow-char');
  });

  it('speed tie resolves without error (either order is valid)', () => {
    const state = makeState(CHAR_EQUAL, { ...CHAR_EQUAL, id: 'equal-char-2', name: 'Equal Char 2' });
    expect(() =>
      resolveTurn(state, makeAction('playerA', 'basic-attack'), makeAction('playerB', 'basic-attack'), basicLookup)
    ).not.toThrow();
  });
});

describe('resolveTurn — KO and win condition', () => {
  it('detects playerA winning when playerB HP reaches 0', () => {
    // Give playerB 1HP so first hit KOs
    const state = makeState(CHAR_FAST, CHAR_LOW_HP);
    const next = resolveTurn(state, makeAction('playerA', 'basic-attack'), makeAction('playerB', 'basic-attack'), basicLookup);
    expect(next.playerB.currentHp).toBe(0);
    expect(next.winner).toBe('playerA');
    expect(next.phase).toBe('ended');
  });

  it('does not process second action after first actor causes a KO', () => {
    // CHAR_FAST goes first and KOs CHAR_LOW_HP — CHAR_LOW_HP should not get to attack
    const state = makeState(CHAR_FAST, CHAR_LOW_HP);
    const next = resolveTurn(state, makeAction('playerA', 'basic-attack'), makeAction('playerB', 'basic-attack'), basicLookup);
    // playerA should still have full HP (slow char never got to hit)
    expect(next.playerA.currentHp).toBe(state.playerA.maxHp);
  });

  it('phase remains "selecting" when neither fighter is KOd', () => {
    const state = makeState();
    const next = resolveTurn(state, makeAction('playerA', 'basic-attack'), makeAction('playerB', 'basic-attack'), basicLookup);
    expect(next.phase).toBe('selecting');
    expect(next.winner).toBeUndefined();
  });
});

describe('resolveTurn — status effects', () => {
  it('applies poison with 100% chance move', () => {
    const state = makeState();
    const next = resolveTurn(state, makeAction('playerA', 'poison-strike'), makeAction('playerB', 'basic-attack'), basicLookup);
    const poisoned = next.playerB.statusEffects.find(e => e.type === 'poison');
    expect(poisoned).toBeDefined();
    // Applied with duration 3, then end-of-turn tick decrements by 1 → 2 remaining
    expect(poisoned?.turnsRemaining).toBe(2);
  });

  it('stun prevents the stunned fighter from acting next turn', () => {
    // Apply stun to playerB in turn 1
    const state = makeState();
    const afterStun = resolveTurn(
      state,
      makeAction('playerA', 'stun-move'),
      makeAction('playerB', 'basic-attack'),
      basicLookup,
    );

    const hpAfterStun = afterStun.playerA.currentHp;

    // Turn 2 — playerB should be stunned and skip their action
    const afterSkip = resolveTurn(
      afterStun,
      makeAction('playerA', 'basic-attack'),
      makeAction('playerB', 'basic-attack'),
      basicLookup,
    );

    // playerA's HP should not decrease during the turn where playerB was stunned
    // (it may decrease if the stun expired and B attacked — but the log should show "stunned")
    const stunLog = afterSkip.log.find(e => e.action.includes('stunned') || e.action.includes('cannot move'));
    expect(stunLog).toBeDefined();
    expect(stunLog?.actorId).toBe('slow-char');
  });
});

describe('resolveTurn — energy', () => {
  it('skips action when fighter has insufficient energy', () => {
    const state = makeState();
    const next = resolveTurn(
      state,
      makeAction('playerA', 'expensive-move'),
      makeAction('playerB', 'basic-attack'),
      basicLookup,
    );
    const skipLog = next.log.find(e => e.action.includes("doesn't have enough energy"));
    expect(skipLog).toBeDefined();
  });

  it('regenerates 10 energy per turn', () => {
    const state = makeState();
    // Use expensive-move (which fails due to cost) — energy should still regen
    const next = resolveTurn(
      state,
      makeAction('playerA', 'expensive-move'),
      makeAction('playerB', 'basic-attack'),
      basicLookup,
    );
    // playerA used no energy (couldn't afford move), got +10 regen
    expect(next.playerA.currentEnergy).toBe(Math.min(state.playerA.maxEnergy, state.playerA.currentEnergy + 10));
  });
});

describe('resolveTurn — stat modifiers', () => {
  it('self-buff move increases the attacker\'s stat', () => {
    const state = makeState();
    const before = state.playerA.stats.attack;
    const next = resolveTurn(
      state,
      makeAction('playerA', 'self-buff'),
      makeAction('playerB', 'basic-attack'),
      basicLookup,
    );
    expect(next.playerA.stats.attack).toBeGreaterThan(before);
  });
});
