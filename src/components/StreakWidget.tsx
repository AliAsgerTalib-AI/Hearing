import React from 'react';
import { motion } from 'motion/react';
import { Flame, Trophy } from 'lucide-react';
import { useGamification } from '../contexts/GamificationContext';

export const StreakWidget = () => {
  const { progress } = useGamification();

  if (!progress) return null;

  const { currentStreak, longestStreak, weeklyProgress, weeklyGoal } = progress;

  const isOnStreak = currentStreak > 0;
  const weeklyComplete = weeklyProgress >= weeklyGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2"
    >
      {/* Current Streak */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
        isOnStreak
          ? 'bg-orange-100 text-orange-700 shadow-sm'
          : 'bg-slate-100 text-slate-600'
      }`}>
        <Flame size={16} className={isOnStreak ? 'text-orange-500' : 'text-slate-400'} />
        <span>{currentStreak}</span>
      </div>

      {/* Weekly Goal Progress */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
        weeklyComplete
          ? 'bg-emerald-100 text-emerald-700 shadow-sm'
          : 'bg-slate-100 text-slate-600'
      }`}>
        <Trophy size={16} className={weeklyComplete ? 'text-emerald-500' : 'text-slate-400'} />
        <span>{weeklyProgress}/{weeklyGoal}</span>
      </div>
    </motion.div>
  );
};
