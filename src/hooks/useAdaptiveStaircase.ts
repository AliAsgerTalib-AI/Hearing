import { useState, useCallback } from 'react';
import { STAIRCASE } from '../lib/constants';

interface StaircaseState {
  currentDb: number;
  lastResponse: boolean | null;
  confirmedThreshold: number | null;
  history: { db: number; heard: boolean }[];
}

export interface UseAdaptiveStaircaseProps {
  maxDb: number;
  minDb: number;
  startDb: number;
}

export interface UseAdaptiveStaircaseReturn {
  state: StaircaseState;
  handleResponse: (heard: boolean, ceilingReached?: boolean) => number | null;
  reset: (startDb: number) => void;
}

export function useAdaptiveStaircase({
  maxDb,
  minDb,
  startDb
}: UseAdaptiveStaircaseProps): UseAdaptiveStaircaseReturn {
  const [state, setState] = useState<StaircaseState>({
    currentDb: startDb,
    lastResponse: null,
    confirmedThreshold: null,
    history: []
  });

  const handleResponse = useCallback((heard: boolean, ceilingReached = false): number | null => {
    const nextHistory = [...state.history, { db: state.currentDb, heard }];

    if (heard) {
      const nextDb = Math.max(minDb, state.currentDb - STAIRCASE.DESCENDING_STEP_DB);
      const wasAscending = state.lastResponse === false;
      const previouslyHeardAtThisLevel = state.history.some(
        h => h.db === state.currentDb && h.heard
      );

      if (wasAscending && previouslyHeardAtThisLevel) {
        const confirmedThreshold = state.currentDb;
        setState(prev => ({
          ...prev,
          confirmedThreshold,
          history: nextHistory
        }));
        return confirmedThreshold;
      } else {
        setState(prev => ({
          ...prev,
          currentDb: nextDb,
          lastResponse: true,
          history: nextHistory
        }));
        return null;
      }
    } else {
      const nextDb = Math.min(maxDb, state.currentDb + STAIRCASE.ASCENDING_STEP_DB);

      if (ceilingReached || state.currentDb >= maxDb) {
        const confirmedThreshold = maxDb + 5;
        setState(prev => ({
          ...prev,
          confirmedThreshold,
          history: nextHistory
        }));
        return confirmedThreshold;
      } else {
        setState(prev => ({
          ...prev,
          currentDb: nextDb,
          lastResponse: false,
          history: nextHistory
        }));
        return null;
      }
    }
  }, [state, maxDb, minDb]);

  const reset = useCallback((newStartDb: number) => {
    setState({
      currentDb: newStartDb,
      lastResponse: null,
      confirmedThreshold: null,
      history: []
    });
  }, []);

  return {
    state,
    handleResponse,
    reset
  };
}
