/**
 * Centralized type definitions for the hearing assessment application.
 * Imported by components to ensure type consistency across the codebase.
 */

export interface Demographics {
  age: number;
  sex: 'male' | 'female' | 'other';
}

export interface TestResult {
  side: 'left' | 'right' | 'both';
  freq: number;
  db: number;
}

export interface Exercise {
  title: string;
  description: string;
  science: string;
  durationMinutes: number;
  frequencyHz?: number;
}

export interface AuditoryPlan {
  dailyFocus: string;
  exercises: Exercise[];
  insight: string;
}

export type DeviceType = 'earbuds' | 'iem' | 'headphones' | 'speakers';

export interface HearingHistoryEntry {
  id: string;
  date: string;
  demographics: Demographics | null;
  device: DeviceType | null;
  results: TestResult[];
  avgLeft: number;
  avgRight: number;
}
