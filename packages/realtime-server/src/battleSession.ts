import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Server } from 'socket.io';
import type {
  BattleState,
  BattleAction,
  PlayerKey,
  Character,
  Move,
  TeamDoc,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@anime-showdown/shared-types';
import { resolveTurn, createInitialBattleState } from '@anime-showdown/battle-engine';
import type { MoveWithData, FighterSpec } from '@anime-showdown/battle-engine';

// Load character/move data at startup
const dataDir = resolve(__dirname, '../../../data');
const characters: Character[] = JSON.parse(readFileSync(resolve(dataDir, 'characters.json'), 'utf-8'));
const moves: Move[] = JSON.parse(readFileSync(resolve(dataDir, 'moves.json'), 'utf-8'));
const movesById = new Map<string, MoveWithData>(moves.map(m => [m.id, m as MoveWithData]));
const charsById = new Map<string, Character>(characters.map(c => [c.id, c]));

function moveLookup(id: string): MoveWithData | undefined {
  return movesById.get(id);
}

function buildFighterSpecs(team?: TeamDoc, singleCharId?: string): FighterSpec[] {
  if (team && team.slots && team.slots.length > 0) {
    return team.slots.map(s => {
      const char = charsById.get(s.characterId) || charsById.get('kaze')!;
      return {
        id: char.id,
        name: char.name,
        baseStats: char.baseStats,
        moveIds: s.moveIds && s.moveIds.length > 0 ? s.moveIds : char.moveIds,
        relicId: s.relicId,
      };
    });
  } else if (team && team.characterIds && team.characterIds.length > 0) {
    return team.characterIds.map(cid => {
      const char = charsById.get(cid) || charsById.get('kaze')!;
      return {
        id: char.id,
        name: char.name,
        baseStats: char.baseStats,
        moveIds: char.moveIds,
      };
    });
  }
  const fallback = charsById.get(singleCharId || 'kaze') || charsById.values().next().value!;
  return [{
    id: fallback.id,
    name: fallback.name,
    baseStats: fallback.baseStats,
    moveIds: fallback.moveIds,
  }];
}

type AppIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

interface PendingAction {
  action: BattleAction;
  resolvedAt: number;
}

export class BattleSession {
  readonly battleId: string;
  private state: BattleState;
  private socketA: string;
  private socketB: string;
  private io: AppIO;
  private pendingActions: Map<PlayerKey, PendingAction> = new Map();

  constructor(
    battleId: string,
    socketA: string,
    teamA: TeamDoc | undefined,
    charIdA: string | undefined,
    socketB: string,
    teamB: TeamDoc | undefined,
    charIdB: string | undefined,
    format: string,
    io: AppIO,
    usernameA?: string,
    usernameB?: string,
  ) {
    this.battleId = battleId;
    this.socketA = socketA;
    this.socketB = socketB;
    this.io = io;

    const specsA = buildFighterSpecs(teamA, charIdA);
    const specsB = buildFighterSpecs(teamB, charIdB);

    this.state = createInitialBattleState(battleId, specsA, specsB, format);
    if (usernameA) this.state.playerA.username = usernameA;
    if (usernameB) this.state.playerB.username = usernameB;
  }

  start(): void {
    this.io.to(this.socketA).emit('battle:start', {
      battleId: this.battleId,
      state: this.state,
      yourKey: 'playerA',
    });
    this.io.to(this.socketB).emit('battle:start', {
      battleId: this.battleId,
      state: this.state,
      yourKey: 'playerB',
    });
    console.log(`[Battle ${this.battleId}] Started (Format: ${this.state.format || '6v6'})`);
  }

  submitAction(socketId: string, payload: { type?: 'move' | 'switch'; moveId?: string; switchIndex?: number } | string): void {
    const playerKey: PlayerKey | null = socketId === this.socketA ? 'playerA' : socketId === this.socketB ? 'playerB' : null;
    if (!playerKey) return;

    if (this.pendingActions.has(playerKey)) {
      console.warn(`[Battle ${this.battleId}] Duplicate action from ${playerKey} — ignored`);
      return;
    }

    const action: BattleAction = typeof payload === 'string'
      ? { playerKey, type: 'move', moveId: payload }
      : { playerKey, type: payload.type || 'move', moveId: payload.moveId, switchIndex: payload.switchIndex };

    this.pendingActions.set(playerKey, {
      action,
      resolvedAt: Date.now(),
    });

    console.log(`[Battle ${this.battleId}] Action from ${playerKey}: ${JSON.stringify(action)}`);

    if (this.state.phase === 'switching') {
      const aDone = !this.state.playerA.mustSwitch || this.pendingActions.has('playerA');
      const bDone = !this.state.playerB.mustSwitch || this.pendingActions.has('playerB');
      if (aDone && bDone) {
        this.resolveTurn();
      }
    } else if (this.pendingActions.size === 2) {
      this.resolveTurn();
    }
  }

  private resolveTurn(): void {
    const actionA: BattleAction = this.pendingActions.get('playerA')?.action || { playerKey: 'playerA', type: 'move' };
    const actionB: BattleAction = this.pendingActions.get('playerB')?.action || { playerKey: 'playerB', type: 'move' };
    this.pendingActions.clear();

    try {
      this.state = resolveTurn(this.state, actionA, actionB, moveLookup);
    } catch (err) {
      console.error(`[Battle ${this.battleId}] Engine error:`, err);
      this.io.to(this.socketA).emit('battle:error', { message: 'Battle engine error — please reconnect' });
      this.io.to(this.socketB).emit('battle:error', { message: 'Battle engine error — please reconnect' });
      return;
    }

    if (this.state.phase === 'ended') {
      const winner = this.state.winner ?? 'draw';
      this.io.to(this.socketA).emit('battle:end', { state: this.state, winner });
      this.io.to(this.socketB).emit('battle:end', { state: this.state, winner });
      console.log(`[Battle ${this.battleId}] Ended — winner: ${winner}`);
      activeSessions.delete(this.battleId);
    } else {
      this.io.to(this.socketA).emit('battle:stateUpdate', { state: this.state });
      this.io.to(this.socketB).emit('battle:stateUpdate', { state: this.state });
    }
  }

  forfeit(socketId: string): void {
    const forfeitedKey: PlayerKey = socketId === this.socketA ? 'playerA' : 'playerB';
    const winner: PlayerKey = forfeitedKey === 'playerA' ? 'playerB' : 'playerA';

    const finalState: BattleState = { ...this.state, phase: 'ended', winner };
    this.io.to(this.socketA).emit('battle:end', { state: finalState, winner });
    this.io.to(this.socketB).emit('battle:end', { state: finalState, winner });
    console.log(`[Battle ${this.battleId}] Forfeit by ${forfeitedKey}`);
    activeSessions.delete(this.battleId);
  }

  hasSocket(socketId: string): boolean {
    return socketId === this.socketA || socketId === this.socketB;
  }
}

export const activeSessions = new Map<string, BattleSession>();
