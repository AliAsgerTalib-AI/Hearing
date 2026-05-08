export type ScenarioId = 'receptionist' | 'restaurant_order' | 'navigation';
export type EnvironmentId = 'restaurant' | 'airport' | 'subway' | 'concert_hall' | 'times_square';

export interface SoundCoinTransaction {
  id: string;
  timestamp: number;
  amount: number;
  reason: string;
  scenarioId?: ScenarioId;
}

export interface SoundCoinLedger {
  balance: number;
  transactions: SoundCoinTransaction[];
}

export interface ScenarioProgress {
  scenarioId: ScenarioId;
  completions: number;
  bestAccuracy: number;
  lastPlayed: string;
}

export interface ScenarioStorageData {
  coins: SoundCoinLedger;
  scenarioProgress: ScenarioProgress[];
  unlockedEnvironments: EnvironmentId[];
}

export const ENVIRONMENT_UNLOCK_COSTS: Record<EnvironmentId, number> = {
  restaurant: 0,
  airport: 100,
  subway: 250,
  concert_hall: 500,
  times_square: 1000,
};

export const ENVIRONMENT_DIFFICULTY: Record<EnvironmentId, number> = {
  restaurant: 1,
  airport: 2,
  subway: 3,
  concert_hall: 4,
  times_square: 5,
};

export function calculateCoinReward(accuracy: number, difficulty: number): number {
  return Math.floor(difficulty * 20 * (accuracy / 100));
}
