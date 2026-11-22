import { useCallback, useEffect, useRef, useState } from 'react';

import { getSolveTimeStats, RiddleId, useMorningStore } from '@/store/useMorningStore';

export interface SolveResult {
  elapsedMs: number;
  isNewBest: boolean;
}

/**
 * Tracks elapsed solve time for a single riddle attempt using refs so render stays pure.
 */
export function useSolveTimer(riddleId: RiddleId) {
  const recordSolveTime = useMorningStore((state) => state.recordSolveTime);
  const startedAtRef = useRef<number | null>(null);
  const recordedRef = useRef(false);
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const resetTimer = useCallback(() => {
    startedAtRef.current = Date.now();
    recordedRef.current = false;
    setSolveResult(null);
  }, []);

  const completeSolve = useCallback(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;

    const startedAt = startedAtRef.current;
    if (startedAt === null) return;

    const elapsedMs = Math.max(1, Math.round(Date.now() - startedAt));
    const currentSolveTimes = useMorningStore.getState().solveTimes;
    const priorStats = getSolveTimeStats(currentSolveTimes, riddleId);
    const isNewBest = priorStats.bestMs === null || elapsedMs < priorStats.bestMs;

    recordSolveTime(riddleId, elapsedMs);
    setSolveResult({ elapsedMs, isNewBest });
  }, [recordSolveTime, riddleId]);

  return {
    solveResult,
    completeSolve,
    resetTimer,
  };
}
