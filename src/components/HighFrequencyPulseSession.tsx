import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, X, Zap, Brain, TrendingUp } from 'lucide-react';
import { Button, Card } from './ui/basic';
import { HighFrequencyPulseExercise } from '../lib/HighFrequencyPulseExercise';
import { useGamification } from '../contexts/GamificationContext';

export interface HighFrequencyPulseSessionProps {
  onClose: () => void;
}

export const HighFrequencyPulseSession: React.FC<HighFrequencyPulseSessionProps> = ({ onClose }) => {
  const [exercise] = useState(() => new HighFrequencyPulseExercise());
  const [isPlaying, setIsPlaying] = useState(false);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [sessionStartTime] = useState(Date.now());
  const { recordSession } = useGamification();

  const state = exercise.getState();
  const levelConfig = exercise.getLevelConfig();

  const handlePlaySequence = async () => {
    setIsPlaying(true);
    setShowingAnswer(false);
    setFeedback(null);

    try {
      const sequence = exercise.generateSequence();
      await exercise.playSequence(sequence);
    } finally {
      setIsPlaying(false);
      setShowingAnswer(true);
    }
  };

  const handleResponse = (correct: boolean) => {
    exercise.recordResponse(correct);
    setFeedback(correct ? 'correct' : 'incorrect');

    setTimeout(() => {
      setFeedback(null);
      setShowingAnswer(false);
    }, 1500);
  };

  const handleEndSession = () => {
    exercise.stop();

    // Record session if any trials were completed
    if (state.totalTrials > 0) {
      const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
      recordSession(
        3, // exerciseId for High Frequency Pulse
        'High Frequency Pulse',
        durationSeconds,
        state.accuracy,
        state.level
      );
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {sessionActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && handleEndSession()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Zap className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">High Frequency Pulse</h2>
                    <p className="text-xs opacity-90">Neural stimulation training</p>
                  </div>
                </div>
                <button
                  onClick={handleEndSession}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Level Info */}
              <motion.div layout className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800">Level {state.level}</h3>
                    <p className="text-xs text-slate-500">{exercise.getLevelDescription()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{state.accuracy}%</p>
                    <p className="text-xs text-slate-500">Accuracy</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${state.accuracy}%` }}
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                    transition={{ type: 'spring', stiffness: 50, damping: 25 }}
                  />
                </div>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Frequency</p>
                  <p className="text-lg font-bold text-purple-600">{state.frequency}Hz</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Trials</p>
                  <p className="text-lg font-bold text-purple-600">{state.totalTrials}</p>
                </Card>
              </div>

              {/* Main Exercise Area */}
              <div className="space-y-4">
                {/* Play Button */}
                <motion.div layout>
                  <Button
                    onClick={handlePlaySequence}
                    disabled={isPlaying || showingAnswer}
                    className="w-full h-16 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold text-lg rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <Play size={24} />
                    {isPlaying ? 'Playing Sequence...' : 'Play Pulse Sequence'}
                  </Button>
                </motion.div>

                {/* Response Area */}
                <AnimatePresence mode="wait">
                  {showingAnswer && !feedback && (
                    <motion.div
                      key="responses"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <p className="text-center text-slate-600 text-sm font-medium">Did you hear the pulses clearly?</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleResponse(true)}
                          className="h-12 bg-green-500 text-white hover:bg-green-600 rounded-lg font-semibold"
                        >
                          Yes, Clear
                        </Button>
                        <Button
                          onClick={() => handleResponse(false)}
                          className="h-12 bg-slate-300 text-slate-700 hover:bg-slate-400 rounded-lg font-semibold"
                        >
                          No, Unclear
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {feedback && (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`p-4 rounded-xl text-center ${
                        feedback === 'correct'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <p className="font-semibold">
                        {feedback === 'correct' ? '✓ Excellent!' : '→ Keep going!'}
                      </p>
                      <p className="text-xs mt-1">
                        {feedback === 'correct'
                          ? 'You detected the pulses accurately'
                          : 'Try to focus on the high frequency'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Info Box */}
              <Card className="p-4 bg-slate-50 border-slate-200 space-y-2">
                <div className="flex gap-2 text-xs text-slate-600">
                  <Brain size={14} className="flex-shrink-0 mt-0.5" />
                  <p>
                    <span className="font-semibold">Neuroplasticity Tip:</span> High-frequency stimulation activates auditory cortex regions responsible for speech clarity. Consistent practice rewires neural pathways.
                  </p>
                </div>
              </Card>

              {/* Challenge Info */}
              <Card className="p-4 bg-purple-50 border-purple-200">
                <p className="text-xs font-semibold text-purple-700 mb-2">Current Challenge</p>
                <ul className="text-xs space-y-1 text-purple-600">
                  <li>• <span className="font-medium">{levelConfig.pulseCount} pulses</span> per sequence</li>
                  <li>• <span className="font-medium">{(levelConfig.baseDuration * 1000).toFixed(0)}ms</span> pulse duration</li>
                  <li>• <span className="font-medium">{state.frequency}Hz</span> frequency target</li>
                </ul>
              </Card>

              {/* End Session Button */}
              <Button
                onClick={handleEndSession}
                variant="secondary"
                className="w-full h-12 flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                End Session
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
