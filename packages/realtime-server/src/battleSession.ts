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

function buildFighterSpecs(team?: TeamDoc, singleCharId?: string, format: string = 'ou_6v6'): FighterSpec[] {
  let initialSpecs: FighterSpec[] = [];

  if (team && team.slots && team.slots.length > 0) {
    initialSpecs = team.slots.map(s => {
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
    initialSpecs = team.characterIds.map(cid => {
      const char = charsById.get(cid) || charsById.get('kaze')!;
      return {
        id: char.id,
        name: char.name,
        baseStats: char.baseStats,
        moveIds: char.moveIds,
      };
    });
  } else {
    let fallback = singleCharId ? charsById.get(singleCharId) : undefined;
    if (!fallback) {
      const randomIdx = Math.floor(Math.random() * characters.length);
      fallback = characters[randomIdx] || charsById.values().next().value!;
    }
    initialSpecs = [{
      id: fallback.id,
      name: fallback.name,
      baseStats: fallback.baseStats,
      moveIds: fallback.moveIds,
    }];
  }

  // Determine required team size for format
  let targetSize = 6;
  if (format === 'blitz_3v3' || format === '3v3') targetSize = 3;
  if (format === 'quick_1v1' || format === '1v1') targetSize = 1;

  // Trim team if too large for selected format
  if (initialSpecs.length > targetSize) {
    initialSpecs = initialSpecs.slice(0, targetSize);
  }

  // Auto-fill diverse characters if team is smaller than format demands (e.g. starter in 6v6 or 3v3)
  if (initialSpecs.length < targetSize) {
    const usedIds = new Set(initialSpecs.map(s => s.id));
    const shuffled = [...characters].sort(() => 0.5 - Math.random());
    for (const char of shuffled) {
      if (initialSpecs.length >= targetSize) break;
      if (!usedIds.has(char.id)) {
        usedIds.add(char.id);
        initialSpecs.push({
          id: char.id,
          name: char.name,
          baseStats: char.baseStats,
          moveIds: char.moveIds,
        });
      }
    }
  }

  return initialSpecs;
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

    const specsA = buildFighterSpecs(teamA, charIdA, format);
    const specsB = buildFighterSpecs(teamB, charIdB, format);

    this.state = createInitialBattleState(battleId, specsA, specsB, format);
    if (usernameA) this.state.playerA.username = usernameA;
    if (usernameB) this.state.playerB.username = usernameB;
  }

  private isBotBattle(): boolean {
    return this.socketB.startsWith('BOT_');
  }

  private triggerBotActionIfNeeded(immediate: boolean = false): void {
    if (!this.isBotBattle() || this.state.phase === 'ended') return;
    if (this.pendingActions.has('playerB')) return;

    const execute = () => {
      if (this.state.phase === 'ended' || this.pendingActions.has('playerB')) return;

      if (this.state.phase === 'switching') {
        if (this.state.playerB.mustSwitch) {
          const aliveIdx = this.state.playerB.team.findIndex((f, idx) => f.isAlive && idx !== this.state.playerB.activeIdx);
          if (aliveIdx !== -1) {
            this.submitAction(this.socketB, { type: 'switch', switchIndex: aliveIdx });
          }
        }
      } else {
        const currentFighter = this.state.playerB.team[this.state.playerB.activeIdx] || (this.state.playerB as any);
        if (currentFighter.currentEnergy !== undefined && currentFighter.currentEnergy < 25) {
          this.submitAction(this.socketB, { type: 'move', moveId: 'recharge' });
        } else {
          const availableMoves = currentFighter.moveIds || ['strike'];
          const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)] || 'strike';
          this.submitAction(this.socketB, { type: 'move', moveId: randomMove });
        }
      }
    };

    if (immediate) {
      execute();
    } else {
      setTimeout(execute, 450);
    }
  }

  start(): void {
    this.io.to(this.socketA).emit('battle:start', {
      battleId: this.battleId,
      state: this.state,
      yourKey: 'playerA',
    });
    if (!this.isBotBattle()) {
      this.io.to(this.socketB).emit('battle:start', {
        battleId: this.battleId,
        state: this.state,
        yourKey: 'playerB',
      });
    }
    console.log(`[Battle ${this.battleId}] Started (Format: ${this.state.format || 'ou_6v6'})`);
    this.triggerBotActionIfNeeded();
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

    if (socketId === this.socketA && this.isBotBattle()) {
      this.triggerBotActionIfNeeded(true);
    }

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
      if (!this.isBotBattle()) {
        this.io.to(this.socketB).emit('battle:error', { message: 'Battle engine error — please reconnect' });
      }
      return;
    }

    if (this.state.phase === 'ended') {
      const winner = this.state.winner ?? 'draw';
      this.io.to(this.socketA).emit('battle:end', { state: this.state, winner });
      if (!this.isBotBattle()) {
        this.io.to(this.socketB).emit('battle:end', { state: this.state, winner });
      }
      console.log(`[Battle ${this.battleId}] Ended — winner: ${winner}`);
      activeSessions.delete(this.battleId);
    } else {
      this.io.to(this.socketA).emit('battle:stateUpdate', { state: this.state });
      if (!this.isBotBattle()) {
        this.io.to(this.socketB).emit('battle:stateUpdate', { state: this.state });
      }
      this.triggerBotActionIfNeeded(false);
    }
  }

  forfeit(socketId: string): void {
    const forfeitedKey: PlayerKey = socketId === this.socketA ? 'playerA' : 'playerB';
    const winner: PlayerKey = forfeitedKey === 'playerA' ? 'playerB' : 'playerA';

    const finalState: BattleState = { ...this.state, phase: 'ended', winner };
    this.io.to(this.socketA).emit('battle:end', { state: finalState, winner });
    if (!this.isBotBattle()) {
      this.io.to(this.socketB).emit('battle:end', { state: finalState, winner });
    }
    console.log(`[Battle ${this.battleId}] Forfeit by ${forfeitedKey}`);
    activeSessions.delete(this.battleId);
  }

  hasSocket(socketId: string): boolean {
    return socketId === this.socketA || socketId === this.socketB;
  }
}

export const activeSessions = new Map<string, BattleSession>();
