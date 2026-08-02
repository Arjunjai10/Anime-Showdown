import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Server } from 'socket.io';
import type {
  BattleState,
  BattleAction,
  PlayerKey,
  Character,
  Move,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@anime-showdown/shared-types';
import { resolveTurn, createInitialBattleState } from '@anime-showdown/battle-engine';
import type { MoveWithData } from '@anime-showdown/battle-engine';

// Load character/move data at startup
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../../../data');
const characters: Character[] = JSON.parse(readFileSync(resolve(dataDir, 'characters.json'), 'utf-8'));
const moves: Move[] = JSON.parse(readFileSync(resolve(dataDir, 'moves.json'), 'utf-8'));
const movesById = new Map<string, MoveWithData>(moves.map(m => [m.id, m as MoveWithData]));
const charsById = new Map<string, Character>(characters.map(c => [c.id, c]));

/** Server-authoritative lookup passed to the engine — no I/O inside */
function moveLookup(id: string): MoveWithData | undefined {
  return movesById.get(id);
}

type AppIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

interface PendingAction {
  action: BattleAction;
  resolvedAt: number;
}

/**
 * BattleSession — manages a single 1v1 battle between two sockets.
 *
 * Lifecycle:
 *  1. Created by socketHandlers when two players are matched
 *  2. Waits for both players to submit a move each turn
 *  3. Calls resolveTurn, broadcasts new state to both sockets
 *  4. Detects end condition, emits battle:end, cleans itself up
 */
export class BattleSession {
  readonly battleId: string;
  private state: BattleState;
  private socketA: string;
  private socketB: string;
  private io: AppIO;
  private pendingActions: Map<PlayerKey, PendingAction> = new Map();

  constructor(battleId: string, socketA: string, charIdA: string, socketB: string, charIdB: string, io: AppIO) {
    const charA = charsById.get(charIdA);
    const charB = charsById.get(charIdB);

    if (!charA || !charB) {
      throw new Error(`Invalid characters: ${charIdA}, ${charIdB}`);
    }

    this.battleId = battleId;
    this.socketA = socketA;
    this.socketB = socketB;
    this.io = io;
    this.state = createInitialBattleState(battleId, charA, charB);
  }

  /** Sends battle:start to both sockets with their respective player keys */
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
    console.log(`[Battle ${this.battleId}] Started`);
  }

  /** Called when a player submits their move for the current turn */
  submitAction(socketId: string, moveId: string): void {
    const playerKey: PlayerKey | null = socketId === this.socketA ? 'playerA' : socketId === this.socketB ? 'playerB' : null;
    if (!playerKey) return;

    // Reject duplicate submissions for the same turn
    if (this.pendingActions.has(playerKey)) {
      console.warn(`[Battle ${this.battleId}] Duplicate action from ${playerKey} — ignored`);
      return;
    }

    this.pendingActions.set(playerKey, {
      action: { playerKey, moveId },
      resolvedAt: Date.now(),
    });

    console.log(`[Battle ${this.battleId}] Action from ${playerKey}: ${moveId}`);

    // Resolve when both players have submitted
    if (this.pendingActions.size === 2) {
      this.resolveTurn();
    }
  }

  private resolveTurn(): void {
    const actionA = this.pendingActions.get('playerA')!.action;
    const actionB = this.pendingActions.get('playerB')!.action;
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

  /** Called when a player disconnects mid-battle — forfeit */
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

/** Global session registry — one entry per active battle */
export const activeSessions = new Map<string, BattleSession>();
