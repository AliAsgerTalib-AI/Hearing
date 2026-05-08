import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ScenarioId,
  EnvironmentId,
  ScenarioStorageData,
  ScenarioProgress,
  ENVIRONMENT_UNLOCK_COSTS,
  calculateCoinReward,
} from '../types/scenarios';

interface ScenarioContextType {
  coins: number;
  isEnvironmentUnlocked: (envId: EnvironmentId) => boolean;
  canAfford: (envId: EnvironmentId) => boolean;
  spendCoins: (envId: EnvironmentId) => boolean;
  awardCoins: (amount: number, reason: string, scenarioId?: ScenarioId) => void;
  scenarioProgress: ScenarioProgress[];
  recordScenarioCompletion: (scenarioId: ScenarioId, accuracy: number, difficulty: number) => void;
  getScenarioProgress: (scenarioId: ScenarioId) => ScenarioProgress | undefined;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

const STORAGE_KEY = 'hearingScenarioData';

const DEFAULT_STORAGE: ScenarioStorageData = {
  coins: {
    balance: 0,
    transactions: [],
  },
  scenarioProgress: [],
  unlockedEnvironments: ['restaurant'],
};

export function ScenarioProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ScenarioStorageData>(DEFAULT_STORAGE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
      } catch (err) {
        console.warn('Failed to parse scenario data, using default', err);
        setData(DEFAULT_STORAGE);
      }
    } else {
      setData(DEFAULT_STORAGE);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const isEnvironmentUnlocked = (envId: EnvironmentId): boolean => {
    return data.unlockedEnvironments.includes(envId);
  };

  const canAfford = (envId: EnvironmentId): boolean => {
    const cost = ENVIRONMENT_UNLOCK_COSTS[envId];
    return data.coins.balance >= cost;
  };

  const spendCoins = (envId: EnvironmentId): boolean => {
    const cost = ENVIRONMENT_UNLOCK_COSTS[envId];
    if (data.coins.balance < cost) {
      return false;
    }

    setData(prev => ({
      ...prev,
      coins: {
        ...prev.coins,
        balance: prev.coins.balance - cost,
        transactions: [
          ...prev.coins.transactions,
          {
            id: `tx-${Date.now()}`,
            timestamp: Date.now(),
            amount: -cost,
            reason: `Unlock ${envId}`,
          },
        ],
      },
      unlockedEnvironments: [...new Set([...prev.unlockedEnvironments, envId])],
    }));

    return true;
  };

  const awardCoins = (amount: number, reason: string, scenarioId?: ScenarioId) => {
    setData(prev => ({
      ...prev,
      coins: {
        ...prev.coins,
        balance: prev.coins.balance + amount,
        transactions: [
          ...prev.coins.transactions,
          {
            id: `tx-${Date.now()}`,
            timestamp: Date.now(),
            amount,
            reason,
            scenarioId,
          },
        ],
      },
    }));
  };

  const recordScenarioCompletion = (scenarioId: ScenarioId, accuracy: number, difficulty: number) => {
    const coinReward = calculateCoinReward(accuracy, difficulty);
    awardCoins(coinReward, `Complete ${scenarioId}`, scenarioId);

    setData(prev => {
      const existing = prev.scenarioProgress.find(p => p.scenarioId === scenarioId);

      const updated = existing
        ? {
            ...existing,
            completions: existing.completions + 1,
            bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
            lastPlayed: new Date().toISOString().split('T')[0],
          }
        : {
            scenarioId,
            completions: 1,
            bestAccuracy: accuracy,
            lastPlayed: new Date().toISOString().split('T')[0],
          };

      return {
        ...prev,
        scenarioProgress: existing
          ? prev.scenarioProgress.map(p => (p.scenarioId === scenarioId ? updated : p))
          : [...prev.scenarioProgress, updated],
      };
    });
  };

  const getScenarioProgress = (scenarioId: ScenarioId): ScenarioProgress | undefined => {
    return data.scenarioProgress.find(p => p.scenarioId === scenarioId);
  };

  const value: ScenarioContextType = {
    coins: data.coins.balance,
    isEnvironmentUnlocked,
    canAfford,
    spendCoins,
    awardCoins,
    scenarioProgress: data.scenarioProgress,
    recordScenarioCompletion,
    getScenarioProgress,
  };

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useScenario(): ScenarioContextType {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within ScenarioProvider');
  }
  return context;
}
