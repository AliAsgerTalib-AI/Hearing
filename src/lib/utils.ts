import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeGetJSON<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    const parsed = JSON.parse(item);
    return parsed as T;
  } catch (error) {
    console.error(`Failed to retrieve and parse localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function safeSetJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage key "${key}":`, error);
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error);
    return false;
  }
}

interface ThresholdResult {
  side: 'left' | 'right' | 'both';
  freq: number;
  db: number;
}

export function calculateAvgThreshold(results: ThresholdResult[], side: 'left' | 'right'): number {
  const sideResults = results.filter(r => r.side === side);
  if (sideResults.length === 0) return 0;
  const sum = sideResults.reduce((acc, curr) => acc + curr.db, 0);
  return Math.round(sum / sideResults.length);
}

export function calculateThresholds(results: ThresholdResult[]): { avgLeft: number; avgRight: number } {
  return {
    avgLeft: calculateAvgThreshold(results, 'left'),
    avgRight: calculateAvgThreshold(results, 'right')
  };
}

export function enforceHistoryLimit<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}
