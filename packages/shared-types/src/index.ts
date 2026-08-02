// ─── Primitive enums ───────────────────────────────────────────────────────────

export type StatusEffectType = 'poison' | 'burn' | 'stun' | 'slow';
export type MoveType = 'physical' | 'special' | 'status' | 'self';
export type StatKey = 'attack' | 'defense' | 'special' | 'speed';
export type BattlePhase = 'selecting' | 'resolving' | 'ended';
export type PlayerKey = 'playerA' | 'playerB';

// ─── Move ──────────────────────────────────────────────────────────────────────

export interface MoveStatusEffect {
  effect: StatusEffectType;
  /** 0–1 probability the effect is applied */
  chance: number;
  /** How many turns the effect lasts */
  duration: number;
}

export interface MoveStatModifier {
  target: 'self' | 'opponent';
  stat: StatKey;
  /** Multiplicative modifier, e.g. 1.5 = +50% */
  multiplier: number;
  duration: number;
}

export interface Move {
  id: string;
  name: string;
  description: string;
  type: MoveType;
  /** Base power — undefined for status/self moves */
  power?: number;
  /** 0–100 accuracy roll */
  accuracy: number;
  energyCost: number;
  statusEffect?: MoveStatusEffect;
  statModifier?: MoveStatModifier;
  tags?: string[];
}

// ─── Character ─────────────────────────────────────────────────────────────────

export interface CharacterBaseStats {
  maxHp: number;
  maxEnergy: number;
  attack: number;
  defense: number;
  special: number;
  speed: number;
}

export interface CharacterColorScheme {
  primary: string;
  secondary: string;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  archetype: string;
  description: string;
  baseStats: CharacterBaseStats;
  /** References to move IDs in moves.json */
  moveIds: string[];
  colorScheme: CharacterColorScheme;
}

// ─── Battle state ──────────────────────────────────────────────────────────────

export interface StatBlock {
  attack: number;
  defense: number;
  special: number;
  speed: number;
}

export interface ActiveStatusEffect {
  type: StatusEffectType;
  turnsRemaining: number;
}

export interface ActiveStatModifier {
  stat: StatKey;
  multiplier: number;
  turnsRemaining: number;
}

export interface BattleFighterState {
  characterId: string;
  name: string;
  currentHp: number;
  maxHp: number;
  currentEnergy: number;
  maxEnergy: number;
  /** Current effective stats — modified by stat-stage moves */
  stats: StatBlock;
  /** Original base stats, used for restoration after debuffs */
  baseStats: StatBlock;
  statusEffects: ActiveStatusEffect[];
  statModifiers: ActiveStatModifier[];
  moveIds: string[];
}

export interface BattleLogEntry {
  turn: number;
  actorId: string;
  actorName: string;
  action: string;
  damage?: number;
  healing?: number;
  statusApplied?: StatusEffectType;
  missed?: boolean;
  isCrit?: boolean;
}

export interface BattleState {
  id: string;
  turn: number;
  phase: BattlePhase;
  playerA: BattleFighterState;
  playerB: BattleFighterState;
  log: BattleLogEntry[];
  winner?: PlayerKey | 'draw';
}

// ─── Battle actions ────────────────────────────────────────────────────────────

export interface BattleAction {
  playerKey: PlayerKey;
  moveId: string;
}

// ─── Team ──────────────────────────────────────────────────────────────────────

export interface TeamDoc {
  id: string;
  name: string;
  /** Ordered list of character IDs — first is always used in battle (v1) */
  characterIds: string[];
  userId: string;
  createdAt: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  username: string;
}

// ─── Socket.io event map ───────────────────────────────────────────────────────

/**
 * Typed socket event payloads for Socket.io.
 * Format: { eventName: [ArgType] } — matches Socket.io's EventsMap convention.
 *
 * Client → Server events use ClientToServerEvents.
 * Server → Client events use ServerToClientEvents.
 */

export interface ClientToServerEvents {
  'queue:join': (payload: { characterId: string }) => void;
  'queue:leave': () => void;
  'battle:action': (payload: { moveId: string }) => void;
}

export interface ServerToClientEvents {
  'queue:status': (payload: { position: number }) => void;
  'battle:start': (payload: { battleId: string; state: BattleState; yourKey: PlayerKey }) => void;
  'battle:stateUpdate': (payload: { state: BattleState }) => void;
  'battle:end': (payload: { state: BattleState; winner: PlayerKey | 'draw' }) => void;
  'battle:error': (payload: { message: string }) => void;
  'matchmaking:error': (payload: { message: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  username?: string;
  battleId?: string;
  playerKey?: PlayerKey;
  characterId?: string;
}
