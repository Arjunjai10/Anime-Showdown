import { useEffect, useCallback } from 'react';
import { useBattleStore } from '../stores/battleStore';
import { useSocket } from './useSocket';

/**
 * useBattleState — subscribes to socket events and syncs them into the Zustand store.
 *
 * Mount this once on the Battle page. It sets up the battle:start, battle:stateUpdate,
 * and battle:end listeners and tears them down on unmount.
 */
export function useBattleState() {
  const { socket } = useSocket();
  const {
    setBattleStart,
    setBattleState,
    setBattleEnd,
    setBattleError,
    submitAction: storeSubmitAction,
    yourKey,
    battleState,
    battleId,
    winner,
    isWaiting,
    error,
  } = useBattleStore();

  useEffect(() => {
    socket.on('battle:start', ({ battleId, state, yourKey }) => {
      setBattleStart(battleId, state, yourKey);
    });

    socket.on('battle:stateUpdate', ({ state }) => {
      setBattleState(state);
    });

    socket.on('battle:end', ({ state, winner }) => {
      setBattleEnd(state, winner);
    });

    socket.on('battle:error', ({ message }) => {
      setBattleError(message);
    });

    return () => {
      socket.off('battle:start');
      socket.off('battle:stateUpdate');
      socket.off('battle:end');
      socket.off('battle:error');
    };
  }, [socket, setBattleStart, setBattleState, setBattleEnd, setBattleError]);

  /** Submits a move to the server */
  const submitAction = useCallback(
    (payload: string | { type: 'move' | 'switch'; moveId?: string; switchIndex?: number }) => {
      if (typeof payload === 'string') {
        socket.emit('battle:action', { moveId: payload });
        storeSubmitAction(payload);
      } else {
        socket.emit('battle:action', payload);
        storeSubmitAction(payload.moveId || `switch:${payload.switchIndex}`);
      }
    },
    [socket, storeSubmitAction],
  );

  return { battleState, battleId, yourKey, winner, isWaiting, error, submitAction };
}
