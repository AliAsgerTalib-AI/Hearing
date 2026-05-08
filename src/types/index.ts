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
  timestamp: number;
  date: string;
  demographics: Demographics | null;
  device: DeviceType | null;
  results: TestResult[];
  avgLeft: number;
  avgRight: number;
}

// ============================================================================
// SPATIAL AUDIO TYPES
// ============================================================================

export interface SpatialAudioSession {
  exerciseType: 'localization' | 'soundscape';
  environment?: string; // For soundscape
  spatialAccuracy?: number; // How close to correct position
  speakerIdentification?: number; // For soundscapes
}

// ============================================================================
// GAMIFICATION TYPES
// ============================================================================

export type BadgeId =
  | 'first_step' | 'week_warrior' | 'month_master' | 'consistency_king'
  | 'vowel_expert' | 'consonant_pro' | 'frequency_fiend'
  | 'perfect_session' | 'milestone_100' | 'milestone_500';

export interface Badge {
  id: BadgeId;
  title: string;
  description: string;
  icon: string;
  earnedAt?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ExerciseSession {
  id: string;
  exerciseId: number;
  exerciseTitle: string;
  date: string;
  timestamp: number;
  duration: number; // seconds
  accuracy: number; // 0-100
  level: number;
  completed: boolean;
}

export interface GamificationProgress {
  currentStreak: number;
  longestStreak: number;
  lastExerciseDate: string | null;
  totalSessionsCompleted: number;
  totalMinutesSpent: number;
  exerciseStats: {
    vowel: { sessions: number; accuracy: number; bestLevel: number };
    consonant: { sessions: number; accuracy: number; bestLevel: number };
    frequency: { sessions: number; accuracy: number; bestLevel: number };
  };
  badges: Badge[];
  weeklyGoal: number; // target sessions per week
  weeklyProgress: number; // sessions completed this week
}
