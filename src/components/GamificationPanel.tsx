import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Trophy, Target, Zap, BarChart3 } from 'lucide-react';
import { Card } from './ui/basic';
import { useGamification } from '../contexts/GamificationContext';
import { ProgressGraphs } from './ProgressGraphs';

export const GamificationPanel = () => {
  const { progress, getMotivationMessage } = useGamification();
  const [activeTab, setActiveTab] = useState<'achievements' | 'progress'>('achievements');

  if (!progress) {
    return null;
  }

  const {
    currentStreak,
    longestStreak,
    totalSessionsCompleted,
    weeklyProgress,
    weeklyGoal,
    badges,
    exerciseStats,
    totalMinutesSpent
  } = progress;

  const getStreakColor = (streak: number) => {
    if (streak >= 60) return 'from-purple-500 to-pink-500';
    if (streak >= 30) return 'from-orange-500 to-red-500';
    if (streak >= 7) return 'from-blue-500 to-cyan-500';
    return 'from-slate-400 to-slate-500';
  };

  return (
    <div className="p-6 pb-24 space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-2 px-4 rounded-md transition-all font-medium text-sm flex items-center justify-center gap-2 ${
            activeTab === 'achievements'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy size={16} />
          Achievements
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-2 px-4 rounded-md transition-all font-medium text-sm flex items-center justify-center gap-2 ${
            activeTab === 'progress'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 size={16} />
          Progress
        </button>
      </div>

      <div className="space-y-6">
      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Motivation Banner */}
            <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200"
      >
        <p className="text-sm font-semibold text-indigo-900">
          {getMotivationMessage()}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Streak */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`p-4 bg-gradient-to-br ${getStreakColor(currentStreak)} text-white`}>
            <div className="flex items-center gap-2 mb-2">
              <Flame size={20} />
              <span className="text-[10px] uppercase font-bold tracking-widest">Streak</span>
            </div>
            <div className="text-3xl font-bold">{currentStreak}</div>
            <p className="text-xs text-white/80 mt-1">day{currentStreak !== 1 ? 's' : ''}</p>
          </Card>
        </motion.div>

        {/* Longest Streak */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={20} />
              <span className="text-[10px] uppercase font-bold tracking-widest">Record</span>
            </div>
            <div className="text-3xl font-bold">{longestStreak}</div>
            <p className="text-xs text-white/80 mt-1">day streak</p>
          </Card>
        </motion.div>

        {/* Weekly Goal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Target size={20} />
              <span className="text-[10px] uppercase font-bold tracking-widest">Weekly</span>
            </div>
            <div className="text-3xl font-bold">{weeklyProgress}/{weeklyGoal}</div>
            <div className="mt-2 w-full bg-white/30 rounded-full h-1">
              <div
                className="h-1 bg-white rounded-full transition-all"
                style={{ width: `${(weeklyProgress / weeklyGoal) * 100}%` }}
              />
            </div>
          </Card>
        </motion.div>

        {/* Total Sessions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={20} />
              <span className="text-[10px] uppercase font-bold tracking-widest">Total</span>
            </div>
            <div className="text-3xl font-bold">{totalSessionsCompleted}</div>
            <p className="text-xs text-white/80 mt-1">{Math.round(totalMinutesSpent / 60)}h training</p>
          </Card>
        </motion.div>
      </div>

      {/* Exercise Stats */}
      <Card className="p-5 space-y-4">
        <h3 className="font-semibold text-lg">Exercise Progress</h3>
        <div className="space-y-3">
          {[
            { name: 'Vowel Discrimination', key: 'vowel', icon: '🎤', color: 'from-blue-500 to-blue-600' },
            { name: 'Consonant Contrast', key: 'consonant', icon: '🔊', color: 'from-amber-500 to-amber-600' },
            { name: 'High Frequency Pulse', key: 'frequency', icon: '⚡', color: 'from-purple-500 to-purple-600' }
          ].map((exercise) => {
            const stats = exerciseStats[exercise.key as keyof typeof exerciseStats];
            return (
              <motion.div
                key={exercise.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{exercise.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{exercise.name}</p>
                    <p className="text-xs text-slate-500">{stats.sessions} sessions • Level {stats.bestLevel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{stats.accuracy}%</p>
                  <p className="text-xs text-slate-500">accuracy</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Badges Section */}
      {badges.length > 0 && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-lg">Achievements ({badges.length})</h3>
          <div className="grid grid-cols-3 gap-3">
            <AnimatePresence>
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <p className="text-[10px] font-bold text-center leading-tight text-slate-900">
                    {badge.title}
                  </p>
                  <div className={`mt-2 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest
                    ${badge.rarity === 'common' && 'bg-slate-200 text-slate-700'}
                    ${badge.rarity === 'rare' && 'bg-blue-200 text-blue-700'}
                    ${badge.rarity === 'epic' && 'bg-purple-200 text-purple-700'}
                    ${badge.rarity === 'legendary' && 'bg-yellow-200 text-yellow-700'}
                  `}>
                    {badge.rarity}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}

            {/* Empty State for Badges */}
            {badges.length === 0 && (
              <Card className="p-5 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-900">Badges Unlock as You Train</p>
                <p className="text-xs text-slate-500">
                  Complete exercises to earn achievements and badges. Start with your first session!
                </p>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'progress' && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ProgressGraphs />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
