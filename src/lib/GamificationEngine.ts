/**
 * Gamification Engine: Manages streaks, badges, and achievement tracking
 *
 * Tracks user engagement through exercise completion, daily streaks, and badges.
 * Integrates with ExerciseSessions to award achievements and milestones.
 */

import { Badge, BadgeId, ExerciseSession, GamificationProgress } from '../types/index';

const BADGE_DEFINITIONS: Record<BadgeId, Badge> = {
  first_step: {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first exercise session',
    icon: '👣',
    rarity: 'common'
  },
  week_warrior: {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Complete 7 exercise sessions in one week',
    icon: '⚔️',
    rarity: 'rare'
  },
  month_master: {
    id: 'month_master',
    title: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    rarity: 'epic'
  },
  consistency_king: {
    id: 'consistency_king',
    title: 'Consistency King',
    description: 'Maintain a 60-day streak',
    icon: '🏆',
    rarity: 'legendary'
  },
  vowel_expert: {
    id: 'vowel_expert',
    title: 'Vowel Expert',
    description: 'Complete 20 Vowel Discrimination sessions',
    icon: '🎤',
    rarity: 'rare'
  },
  consonant_pro: {
    id: 'consonant_pro',
    title: 'Consonant Pro',
    description: 'Complete 20 Consonant Contrast sessions',
    icon: '🔊',
    rarity: 'rare'
  },
  frequency_fiend: {
    id: 'frequency_fiend',
    title: 'Frequency Fiend',
    description: 'Complete 20 High Frequency Pulse sessions',
    icon: '⚡',
    rarity: 'rare'
  },
  perfect_session: {
    id: 'perfect_session',
    title: 'Perfect Performance',
    description: 'Achieve 100% accuracy in a session',
    icon: '✨',
    rarity: 'epic'
  },
  milestone_100: {
    id: 'milestone_100',
    title: 'Centennial',
    description: 'Complete 100 exercise sessions',
    icon: '💯',
    rarity: 'epic'
  },
  milestone_500: {
    id: 'milestone_500',
    title: 'Legend Status',
    description: 'Complete 500 exercise sessions',
    icon: '🌟',
    rarity: 'legendary'
  }
};

export class GamificationEngine {
  private sessions: ExerciseSession[] = [];
  private progress: GamificationProgress;

  constructor(savedSessions?: ExerciseSession[]) {
    this.sessions = savedSessions || [];
    this.progress = this.calculateProgress();
  }

  /**
   * Record a completed exercise session and update gamification state
   */
  recordSession(
    exerciseId: number,
    exerciseTitle: string,
    duration: number,
    accuracy: number,
    level: number
  ): GamificationProgress {
    const today = new Date().toISOString().split('T')[0];

    const session: ExerciseSession = {
      id: `${Date.now()}-${Math.random()}`,
      exerciseId,
      exerciseTitle,
      date: today,
      timestamp: Date.now(),
      duration,
      accuracy,
      level,
      completed: true
    };

    this.sessions.push(session);
    this.progress = this.calculateProgress();

    return this.progress;
  }

  /**
   * Calculate current gamification progress and awarded badges
   */
  private calculateProgress(): GamificationProgress {
    const today = new Date().toISOString().split('T')[0];
    const lastSession = this.sessions.length > 0
      ? this.sessions[this.sessions.length - 1]
      : null;

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks();

    // Calculate weekly progress
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const weeklyProgress = this.sessions.filter(s => s.date >= weekStartStr).length;

    // Calculate exercise-specific stats
    const exerciseStats = {
      vowel: this.calculateExerciseStats(1),
      consonant: this.calculateExerciseStats(2),
      frequency: this.calculateExerciseStats(3)
    };

    // Calculate total stats
    const totalSessionsCompleted = this.sessions.length;
    const totalMinutesSpent = this.sessions.reduce((sum, s) => sum + s.duration, 0);

    // Determine earned badges
    const badges = this.checkBadges(
      currentStreak,
      longestStreak,
      totalSessionsCompleted,
      weeklyProgress,
      exerciseStats
    );

    return {
      currentStreak,
      longestStreak,
      lastExerciseDate: lastSession?.date || null,
      totalSessionsCompleted,
      totalMinutesSpent,
      exerciseStats,
      badges,
      weeklyGoal: 7,
      weeklyProgress
    };
  }

  /**
   * Calculate current and longest streak
   */
  private calculateStreaks(): { currentStreak: number; longestStreak: number } {
    if (this.sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const dates = [...new Set(this.sessions.map(s => s.date))].sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if streak is still active (last session today or yesterday)
    const lastDate = dates[dates.length - 1];
    const streakActive = lastDate === today || lastDate === yesterdayStr;

    for (let i = 1; i < dates.length; i++) {
      const curr = new Date(dates[i]);
      const prev = new Date(dates[i - 1]);
      const dayDiff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (Math.abs(dayDiff - 1) < 0.1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    currentStreak = streakActive ? tempStreak : 0;

    return { currentStreak, longestStreak };
  }

  /**
   * Calculate stats for a specific exercise
   */
  private calculateExerciseStats(exerciseId: number) {
    const exerciseSessions = this.sessions.filter(s => s.exerciseId === exerciseId);

    if (exerciseSessions.length === 0) {
      return { sessions: 0, accuracy: 0, bestLevel: 0 };
    }

    const avgAccuracy = exerciseSessions.reduce((sum, s) => sum + s.accuracy, 0) /
                        exerciseSessions.length;
    const bestLevel = Math.max(...exerciseSessions.map(s => s.level));

    return {
      sessions: exerciseSessions.length,
      accuracy: Math.round(avgAccuracy),
      bestLevel
    };
  }

  /**
   * Check and award badges based on current progress
   */
  private checkBadges(
    currentStreak: number,
    longestStreak: number,
    totalSessions: number,
    weeklyProgress: number,
    exerciseStats: any
  ): Badge[] {
    const badges: Badge[] = [];
    const awardedBadgeIds = new Set<BadgeId>();

    // First Step - complete first session
    if (totalSessions >= 1 && !awardedBadgeIds.has('first_step')) {
      badges.push(this.getBadge('first_step'));
      awardedBadgeIds.add('first_step');
    }

    // Week Warrior - 7 sessions in a week
    if (weeklyProgress >= 7 && !awardedBadgeIds.has('week_warrior')) {
      badges.push(this.getBadge('week_warrior'));
      awardedBadgeIds.add('week_warrior');
    }

    // Month Master - 30 day streak
    if (longestStreak >= 30 && !awardedBadgeIds.has('month_master')) {
      badges.push(this.getBadge('month_master'));
      awardedBadgeIds.add('month_master');
    }

    // Consistency King - 60 day streak
    if (longestStreak >= 60 && !awardedBadgeIds.has('consistency_king')) {
      badges.push(this.getBadge('consistency_king'));
      awardedBadgeIds.add('consistency_king');
    }

    // Exercise-specific badges
    if (exerciseStats.vowel.sessions >= 20 && !awardedBadgeIds.has('vowel_expert')) {
      badges.push(this.getBadge('vowel_expert'));
      awardedBadgeIds.add('vowel_expert');
    }

    if (exerciseStats.consonant.sessions >= 20 && !awardedBadgeIds.has('consonant_pro')) {
      badges.push(this.getBadge('consonant_pro'));
      awardedBadgeIds.add('consonant_pro');
    }

    if (exerciseStats.frequency.sessions >= 20 && !awardedBadgeIds.has('frequency_fiend')) {
      badges.push(this.getBadge('frequency_fiend'));
      awardedBadgeIds.add('frequency_fiend');
    }

    // Perfect Session - check if any session has 100% accuracy
    if (this.sessions.some(s => s.accuracy === 100) && !awardedBadgeIds.has('perfect_session')) {
      badges.push(this.getBadge('perfect_session'));
      awardedBadgeIds.add('perfect_session');
    }

    // Milestone Badges
    if (totalSessions >= 100 && !awardedBadgeIds.has('milestone_100')) {
      badges.push(this.getBadge('milestone_100'));
      awardedBadgeIds.add('milestone_100');
    }

    if (totalSessions >= 500 && !awardedBadgeIds.has('milestone_500')) {
      badges.push(this.getBadge('milestone_500'));
      awardedBadgeIds.add('milestone_500');
    }

    return badges;
  }

  /**
   * Get badge definition with earned timestamp if available
   */
  private getBadge(badgeId: BadgeId): Badge {
    const badge = BADGE_DEFINITIONS[badgeId];
    return {
      ...badge,
      earnedAt: Date.now()
    };
  }

  /**
   * Get current progress state
   */
  getProgress(): GamificationProgress {
    return this.progress;
  }

  /**
   * Get all exercise sessions
   */
  getSessions(): ExerciseSession[] {
    return this.sessions;
  }

  /**
   * Get sessions for a specific date
   */
  getSessionsForDate(date: string): ExerciseSession[] {
    return this.sessions.filter(s => s.date === date);
  }

  /**
   * Get average accuracy across all sessions
   */
  getOverallAccuracy(): number {
    if (this.sessions.length === 0) return 0;
    const total = this.sessions.reduce((sum, s) => sum + s.accuracy, 0);
    return Math.round(total / this.sessions.length);
  }

  /**
   * Get motivation message based on current progress
   */
  getMotivationMessage(): string {
    const { currentStreak, weeklyProgress, weeklyGoal } = this.progress;

    if (currentStreak >= 60) {
      return '🏆 Legend status! Your consistency is inspiring.';
    }
    if (currentStreak >= 30) {
      return '👑 One month strong! Keep the momentum going.';
    }
    if (currentStreak >= 7) {
      return '⚔️ A full week! You\'re a warrior of auditory training.';
    }
    if (weeklyProgress >= weeklyGoal) {
      return '✨ Weekly goal crushed! Time to celebrate.';
    }
    if (weeklyProgress > 0) {
      return `🔥 Keep going! ${weeklyGoal - weeklyProgress} more sessions to hit your weekly goal.`;
    }
    return '🚀 Ready to start? Your first session awaits!';
  }

  /**
   * Export progress for storage
   */
  export(): { sessions: ExerciseSession[] } {
    return { sessions: this.sessions };
  }
}
