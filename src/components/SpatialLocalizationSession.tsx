import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Compass, Volume2, Brain } from 'lucide-react';
import { Button, Card } from './ui/basic';
import { SpatialLocalizationExercise } from '../lib/SpatialLocalizationExercise';
import { SpatialAudioEngine } from '../lib/SpatialAudioEngine';
import { AudioEngine } from '../lib/AudioEngine';
import { useGamification } from '../contexts/GamificationContext';

export interface SpatialLocalizationSessionProps {
  onClose: () => void;
}

export const SpatialLocalizationSession: React.FC<SpatialLocalizationSessionProps> = ({ onClose }) => {
  const [exercise] = useState(() => {
    const audioEngine = AudioEngine.getInstance();
    const spatialEngine = new SpatialAudioEngine(audioEngine.getContext());
    return new SpatialLocalizationExercise(audioEngine, spatialEngine);
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [showingOptions, setShowingOptions] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [sessionStartTime] = useState(Date.now());
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const { recordSession } = useGamification();

  const state = exercise.getState();
  const levelConfig = exercise.getLevelConfig();
  const availablePositions = exercise.getAvailablePositions();

  const handlePlayTrial = async () => {
    setIsPlaying(true);
    setShowingOptions(false);
    setFeedback(null);
    setSelectedPosition(null);

    try {
      const trial = exercise.generateTrial();
      await exercise.playTrial(trial);
    } finally {
      setIsPlaying(false);
      setShowingOptions(true);
    }
  };

  const handleResponse = (positionIndex: number) => {
    if (!state.currentPosition) return;

    const selectedPos = availablePositions[positionIndex];
    const tolerance = exercise.getResponseTolerance();
    const correct = exercise.isCorrectResponse(selectedPos, tolerance);

    exercise.recordResponse(selectedPos, correct);
    setFeedback(correct ? 'correct' : 'incorrect');
    setSelectedPosition(positionIndex);

    setTimeout(() => {
      setFeedback(null);
      setShowingOptions(false);
    }, 1500);
  };

  const handleEndSession = () => {
    exercise.stop();

    // Record gamification session
    if (state.totalTrials > 0) {
      const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
      recordSession(
        4, // exerciseId for Spatial Localization (new)
        'Spatial Localization',
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
          onClick={(e) => e.target === e.currentTarget && handleEndSession()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Compass className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Spatial Localization</h2>
                    <p className="text-xs opacity-90">3D audio positioning training</p>
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
                    <p className="text-2xl font-bold text-cyan-600">{state.accuracy}%</p>
                    <p className="text-xs text-slate-500">Accuracy</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${state.accuracy}%` }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-600"
                    transition={{ type: 'spring', stiffness: 50, damping: 25 }}
                  />
                </div>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Trials</p>
                  <p className="text-lg font-bold text-cyan-600">{state.totalTrials}</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Correct</p>
                  <p className="text-lg font-bold text-cyan-600">{state.correctTrials}</p>
                </Card>
              </div>

              {/* 3D Compass Visualization */}
              <motion.div
                animate={{ scale: showingOptions ? 1 : 0.95 }}
                className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200"
              >
                <p className="text-xs text-slate-500 mb-4 text-center font-semibold">WHERE DID YOU HEAR THE SOUND?</p>

                {/* Circular Compass Layout */}
                <div className="relative w-48 h-48 mx-auto">
                  {/* Center dot */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 rounded-full z-10" />

                  {/* Compass circles */}
                  <div className="absolute inset-0 rounded-full border border-cyan-300" />
                  <div className="absolute inset-4 rounded-full border border-cyan-200" />

                  {/* Cardinal directions */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-cyan-700">F</div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-cyan-700">B</div>
                  <div className="absolute top-1/2 left-2 transform -translate-y-1/2 text-xs font-bold text-cyan-700">L</div>
                  <div className="absolute top-1/2 right-2 transform -translate-y-1/2 text-xs font-bold text-cyan-700">R</div>

                  {/* Response buttons positioned spatially */}
                  {availablePositions.map((pos, idx) => {
                    // Calculate button position on circle
                    const angle = (pos.azimuth * Math.PI) / 180;
                    const radius = showingOptions ? 72 : 60;
                    const x = Math.sin(angle) * radius;
                    const y = -Math.cos(angle) * radius;

                    // Button label based on position
                    const labels: Record<number, string> = {
                      0: 'F', 45: 'FR', 90: 'R', 135: 'BR',
                      180: 'B', 225: 'BL', 270: 'L', 315: 'FL'
                    };
                    const label = labels[Math.round(pos.azimuth)] || '•';

                    return (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.15 }}
                        onClick={() => handleResponse(idx)}
                        disabled={!showingOptions || feedback !== null}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          transition: 'all 0.3s ease'
                        }}
                        className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                          selectedPosition === idx && feedback
                            ? feedback === 'correct'
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-white border-2 border-cyan-500 text-cyan-700 hover:bg-cyan-100'
                        } ${!showingOptions || feedback !== null ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                      >
                        {label}
                      </motion.button>
                    );
                  })}
                </div>

                <p className="text-center text-xs text-slate-500 mt-4">
                  Positions: F=Front, B=Back, L=Left, R=Right
                </p>
              </motion.div>

              {/* Main Exercise Area */}
              <div className="space-y-4">
                {/* Play Button */}
                <motion.div layout>
                  <Button
                    onClick={handlePlayTrial}
                    disabled={isPlaying || showingOptions}
                    className="w-full h-16 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <Play size={24} />
                    {isPlaying ? 'Playing...' : 'Play Sound'}
                  </Button>
                </motion.div>

                {/* Feedback */}
                <AnimatePresence mode="wait">
                  {feedback && (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`p-4 rounded-xl text-center ${
                        feedback === 'correct'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <p className="font-semibold">
                        {feedback === 'correct' ? '✓ Perfect!' : '✗ Not quite'}
                      </p>
                      <p className="text-xs mt-1">
                        {feedback === 'correct'
                          ? 'You localized the sound correctly'
                          : 'Try to listen more carefully to the spatial cues'}
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
                    <span className="font-semibold">Spatial Tip:</span> Listen carefully to the interaural time and level differences. Your brain uses these cues to pinpoint sound location in 3D space.
                  </p>
                </div>
              </Card>

              {/* Challenge Info */}
              <Card className="p-4 bg-cyan-50 border-cyan-200">
                <p className="text-xs font-semibold text-cyan-700 mb-2">Difficulty Features</p>
                <ul className="text-xs space-y-1 text-cyan-600">
                  <li>• <span className="font-medium">{availablePositions.length} possible positions</span></li>
                  <li>
                    • <span className="font-medium">
                      {levelConfig.elevationRange === 0
                        ? 'Horizontal plane only'
                        : `Elevation range: ±${levelConfig.elevationRange}°`}
                    </span>
                  </li>
                  <li>• <span className="font-medium">Response tolerance: ±{exercise.getResponseTolerance()}°</span></li>
                </ul>
              </Card>

              {/* End Session Button */}
              <Button
                onClick={handleEndSession}
                variant="secondary"
                className="w-full h-12 flex items-center justify-center gap-2"
              >
                Exit Training
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
