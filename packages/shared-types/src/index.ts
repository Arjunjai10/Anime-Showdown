// ─── Primitive enums ───────────────────────────────────────────────────────────

export type StatusEffectType = 'poison' | 'burn' | 'stun' | 'slow';
export type MoveType = 'physical' | 'special' | 'status' | 'self';
export type StatKey = 'attack' | 'defense' | 'special' | 'speed';
export type BattlePhase = 'selecting' | 'resolving' | 'switching' | 'ended';
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

// ─── Relics (Held Items) ───────────────────────────────────────────────────────

export interface Relic {
  id: string;
  name: string;
  description: string;
  effectType: 'heal_low_hp' | 'boost_special' | 'reduce_physical' | 'evade_chance' | 'survive_lethal' | 'energy_regen';
  value: number;
  oneTime?: boolean;
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
  /** Equipped Relic ID for this fighter */
  relicId?: string;
  /** True if a one-time relic (e.g., Senzu Bean) has been triggered */
  relicUsed?: boolean;
  isAlive?: boolean;
}

export interface PlayerBattleState extends BattleFighterState {
  /** Full team roster for this player in this battle (up to 6 fighters) */
  team: BattleFighterState[];
  /** Index of currently active fighter in team[] */
  activeIdx: number;
  /** True if active fighter fainted and player must choose a benched replacement */
  mustSwitch?: boolean;
  username?: string;
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
  playerA: PlayerBattleState;
  playerB: PlayerBattleState;
  log: BattleLogEntry[];
  winner?: PlayerKey | 'draw';
  format?: string;
}

// ─── Battle actions ────────────────────────────────────────────────────────────

export type ActionType = 'move' | 'switch';

export interface BattleAction {
  playerKey: PlayerKey;
  type?: ActionType;
  moveId?: string;      // Used when type === 'move' (or legacy v1 calls)
  switchIndex?: number; // Used when type === 'switch' (target slot in team[])
}

// ─── Team & Format ─────────────────────────────────────────────────────────────

export interface TeamSlot {
  characterId: string;
  moveIds: string[];
  relicId?: string;
}

export interface TeamDoc {
  id: string;
  name: string;
  format?: string;
  slots: TeamSlot[];
  /** Legacy array of character IDs for backward compatibility */
  characterIds: string[];
  userId: string;
  createdAt: string;
}

// ─── Chat & Lobby ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  room: string;
}

export interface LobbyUser {
  id: string;
  username: string;
  status: 'in-lobby' | 'in-queue' | 'in-battle';
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

export interface ClientToServerEvents {
  'queue:join': (payload: { format?: string; team?: TeamDoc; characterId?: string }) => void;
  'queue:leave': () => void;
  'battle:action': (payload: { type?: ActionType; moveId?: string; switchIndex?: number }) => void;
  'chat:send': (payload: { room: string; text: string }) => void;
  'lobby:join': () => void;
}

export interface ServerToClientEvents {
  'queue:status': (payload: { position: number; format?: string }) => void;
  'battle:start': (payload: { battleId: string; state: BattleState; yourKey: PlayerKey }) => void;
  'battle:stateUpdate': (payload: { state: BattleState }) => void;
  'battle:end': (payload: { state: BattleState; winner: PlayerKey | 'draw' }) => void;
  'battle:error': (payload: { message: string }) => void;
  'matchmaking:error': (payload: { message: string }) => void;
  'chat:message': (payload: ChatMessage) => void;
  'lobby:users': (payload: { users: LobbyUser[] }) => void;
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
  team?: TeamDoc;
  format?: string;
}
