import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Zap, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card, Button } from './ui/basic';

export interface NeuroRegimenDetails {
  dailyFocus: string;
  insight: string;
  exercises: Array<{
    title: string;
    description: string;
    science: string;
    durationMinutes: number;
  }>;
  trainingDurationWeeks?: number;
  keyInsights?: string[];
  warnings?: string[];
}

export interface PersonalizedNeuroRegimenDisplayProps {
  regimen: NeuroRegimenDetails | null;
  isLoading?: boolean;
  onStartExercise?: (exerciseTitle: string) => void;
}

export const PersonalizedNeuroRegimenDisplay: React.FC<PersonalizedNeuroRegimenDisplayProps> = ({
  regimen,
  isLoading = false,
  onStartExercise,
}) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="h-8 bg-gradient-to-r from-teal-200 to-cyan-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (!regimen) return null;

  const exercisePriorityColors: Record<string, string> = {
    'Vowel Discrimination': 'blue',
    'Consonant Contrast': 'amber',
    'High Frequency Pulse': 'purple',
  };

  const exerciseDurations: Record<string, number> = {
    'Vowel Discrimination': 5,
    'Consonant Contrast': 8,
    'High Frequency Pulse': 3,
  };

  const totalDailyMinutes = regimen.exercises.reduce((sum, ex) => sum + (ex.durationMinutes || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Daily Focus Header */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-teal-600" />
          <h3 className="font-semibold text-slate-800">Daily Focus</h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed italic">{regimen.dailyFocus}</p>
      </div>

      {/* Key Insight */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">Personalized Insight</h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{regimen.insight}</p>
      </div>

      {/* Recommended Exercises */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-600" />
          Recommended Exercises
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {regimen.exercises.map((exercise, idx) => {
            const colorClass = exercisePriorityColors[exercise.title] || 'slate';
            const colorMap: Record<string, string> = {
              blue: 'bg-blue-50 border-blue-200',
              amber: 'bg-amber-50 border-amber-200',
              purple: 'bg-purple-50 border-purple-200',
              slate: 'bg-slate-50 border-slate-200',
            };

            return (
              <motion.div
                key={exercise.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`p-4 border ${colorMap[colorClass]} space-y-3`}>
                  {/* Title & Duration */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-800">{exercise.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{exercise.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-white rounded-full px-2.5 py-1.5">
                      <Clock size={12} />
                      {exercise.durationMinutes} min
                    </div>
                  </div>

                  {/* Science Explanation */}
                  <div className="bg-white rounded-lg p-3 border border-slate-100">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-700">Why this exercise: </span>
                      {exercise.science}
                    </p>
                  </div>

                  {/* Start Button */}
                  {onStartExercise && (
                    <Button
                      onClick={() => onStartExercise(exercise.title)}
                      variant="primary"
                      className="w-full h-9 text-sm"
                    >
                      Start Exercise
                    </Button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Training Duration & Daily Commitment */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-center">
          <p className="text-xs text-slate-600 mb-1">Daily Commitment</p>
          <p className="text-2xl font-bold text-green-700">{totalDailyMinutes} min</p>
          <p className="text-xs text-slate-500 mt-1">Recommended daily</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 text-center">
          <p className="text-xs text-slate-600 mb-1">Training Duration</p>
          <p className="text-2xl font-bold text-orange-700">{regimen.trainingDurationWeeks || 4} weeks</p>
          <p className="text-xs text-slate-500 mt-1">Recommended regimen</p>
        </Card>
      </div>

      {/* Key Insights */}
      {regimen.keyInsights && regimen.keyInsights.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Brain size={18} className="text-indigo-600" />
            Clinical Insights
          </h3>
          <div className="space-y-2">
            {regimen.keyInsights.slice(0, 3).map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
              >
                <div className="flex-shrink-0 text-indigo-600 mt-0.5">•</div>
                <p className="text-sm text-slate-700">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings/Cautions */}
      {regimen.warnings && regimen.warnings.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-600" />
            Clinical Considerations
          </h3>
          <div className="space-y-2">
            {regimen.warnings.map((warning, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle size={16} className="flex-shrink-0 text-red-600 mt-0.5" />
                <p className="text-sm text-slate-700">{warning}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Neuroplasticity Info */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border border-purple-300">
        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <TrendingUp size={18} />
          Neuroplasticity Foundation
        </h4>
        <p className="text-sm text-purple-900 leading-relaxed">
          Your personalized regimen targets specific auditory cortex regions through repeated exposure to challenge
          stimuli. Expected neural changes: synaptic strengthening, threshold lowering, and improved frequency
          discrimination through long-term potentiation (LTP) mechanisms. Sleep-dependent consolidation essential—aim
          for 7+ hours nightly.
        </p>
      </div>
    </motion.div>
  );
};
