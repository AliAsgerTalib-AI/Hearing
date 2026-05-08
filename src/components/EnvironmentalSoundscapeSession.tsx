import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, MapPin, Volume2, Brain, RotateCcw } from 'lucide-react';
import { Button, Card } from './ui/basic';
import { SoundscapeSimulator, ENVIRONMENTS, EnvironmentType } from '../lib/SoundscapeSimulator';
import { SpatialAudioEngine } from '../lib/SpatialAudioEngine';
import { AudioEngine } from '../lib/AudioEngine';
import { useGamification } from '../contexts/GamificationContext';

export interface EnvironmentalSoundscapeSessionProps {
  onClose: () => void;
}

export const EnvironmentalSoundscapeSession: React.FC<EnvironmentalSoundscapeSessionProps> = ({
  onClose
}) => {
  const [audioEngine] = useState(() => AudioEngine.getInstance());
  const [spatialEngine] = useState(() => new SpatialAudioEngine(audioEngine.getContext()));
  const [soundscape] = useState(() => new SoundscapeSimulator(audioEngine.getContext(), spatialEngine));

  const [environment, setEnvironment] = useState<EnvironmentType>('restaurant');
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [sessionStartTime] = useState(Date.now());
  const [trialsCompleted, setTrialsCompleted] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [feedback, setFeedback] = useState<'listening' | 'correct' | 'incorrect' | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<number | null>(null);
  const { recordSession } = useGamification();

  const envInfo = ENVIRONMENTS[environment];

  const handleEnvironmentChange = (newEnv: EnvironmentType) => {
    setEnvironment(newEnv);
    soundscape.setupEnvironment(newEnv);
  };

  const handlePlaySoundscape = async () => {
    setIsPlaying(true);
    setFeedback('listening');
    setSelectedSpeaker(null);

    try {
      // Generate speaker positions for this environment
      const speakerPositions = soundscape.generateSpeakerDistribution(3);

      // Play multiple overlapping consonant/vowel sounds (simplified)
      const frequencies = [800, 1200, 2000];
      const context = audioEngine.getContext();

      speakerPositions.forEach((pos, idx) => {
        const osc = context.createOscillator();
        const gain = context.createGain();

        osc.frequency.value = frequencies[idx];
        osc.type = 'sine';

        // Envelope
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0.2, context.currentTime + 2);
        gain.gain.linearRampToValueAtTime(0, context.currentTime + 2.05);

        osc.connect(gain);
        spatialEngine.connectSource(`speaker-${idx}`, osc, pos);

        osc.start(context.currentTime);
        osc.stop(context.currentTime + 2);
      });

      // Wait for soundscape to finish
      await new Promise(resolve => setTimeout(resolve, 2500));

      setFeedback(null);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleSpeakerResponse = (speakerIndex: number) => {
    // Simulated correct answer (in real app, would track which was primary speaker)
    const correct = speakerIndex === 0; // First speaker was primary

    setSelectedSpeaker(speakerIndex);
    setFeedback(correct ? 'correct' : 'incorrect');

    setTrialsCompleted(t => t + 1);
    if (correct) {
      setAccuracy(Math.round(((trialsCompleted + 1) / (trialsCompleted + 1)) * 100));
    } else {
      setAccuracy(Math.round((accuracy * trialsCompleted) / (trialsCompleted + 1)));
    }

    setTimeout(() => {
      setFeedback(null);
      setSelectedSpeaker(null);
    }, 1500);
  };

  const handleEndSession = () => {
    soundscape.dispose();
    spatialEngine.dispose();

    // Record gamification session
    if (trialsCompleted > 0) {
      const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
      recordSession(
        5, // exerciseId for Environmental Soundscape
        'Environmental Soundscape',
        durationSeconds,
        accuracy,
        1 // Level (all environments in one exercise)
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
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Environmental Soundscape</h2>
                    <p className="text-xs opacity-90">Immersive 3D audio training</p>
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
              {/* Environment Selection */}
              <motion.div layout className="space-y-3">
                <h3 className="font-semibold text-slate-800">Select Environment</h3>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {(Object.keys(ENVIRONMENTS) as EnvironmentType[]).map((envType) => {
                    const env = ENVIRONMENTS[envType];
                    return (
                      <button
                        key={envType}
                        onClick={() => handleEnvironmentChange(envType)}
                        disabled={isPlaying}
                        className={`p-3 rounded-lg transition-all text-left text-sm ${
                          environment === envType
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        } ${isPlaying ? 'opacity-50 cursor-default' : ''}`}
                      >
                        <p className="font-semibold">{env.name}</p>
                        <p className="text-xs opacity-75">Level {env.difficulty}/5</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Environment Info */}
              <Card className="p-4 bg-emerald-50 border-emerald-200 space-y-2">
                <p className="text-sm font-semibold text-emerald-900">{envInfo.name}</p>
                <p className="text-xs text-emerald-800">{envInfo.description}</p>
                <div className="flex gap-4 text-xs text-emerald-700 mt-2">
                  <div>
                    <span className="font-semibold">Difficulty:</span> {envInfo.difficulty}/5
                  </div>
                  <div>
                    <span className="font-semibold">Speakers:</span> ~{envInfo.typicalSources}
                  </div>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Trials</p>
                  <p className="text-lg font-bold text-emerald-600">{trialsCompleted}</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Accuracy</p>
                  <p className="text-lg font-bold text-emerald-600">{accuracy}%</p>
                </Card>
              </div>

              {/* 3D Visualization */}
              <motion.div
                animate={{ scale: feedback === 'listening' ? 1 : 0.95 }}
                className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 text-center"
              >
                {feedback === 'listening' ? (
                  <div className="space-y-3">
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [10, 20, 10] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                          className="w-1 bg-emerald-500 rounded-full"
                        />
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-emerald-700">Listening to soundscape...</p>
                    <p className="text-xs text-emerald-600">Multiple speakers are positioned around you</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3">WHICH SPEAKER WAS PRIMARY?</p>

                    {/* Speaker response buttons */}
                    <div className="space-y-2">
                      {[0, 1, 2].map((idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleSpeakerResponse(idx)}
                          disabled={!isPlaying && feedback !== null && feedback !== 'listening'}
                          className={`w-full p-3 rounded-lg transition-all font-semibold text-sm ${
                            selectedSpeaker === idx && feedback
                              ? feedback === 'correct'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-white border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-100'
                          } ${isPlaying || feedback === 'listening' ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                        >
                          Speaker {idx + 1}
                        </motion.button>
                      ))}
                    </div>

                    <p className="text-xs text-slate-500 mt-3">
                      Focus on the loudest or most prominent voice/sound
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Main Exercise Area */}
              <div className="space-y-4">
                <motion.div layout>
                  <Button
                    onClick={handlePlaySoundscape}
                    disabled={isPlaying || (feedback !== null && feedback !== 'listening')}
                    className="w-full h-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <Play size={24} />
                    {isPlaying ? 'Playing Soundscape...' : 'Play Soundscape'}
                  </Button>
                </motion.div>

                {/* Feedback */}
                <AnimatePresence mode="wait">
                  {feedback && feedback !== 'listening' && (
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
                        {feedback === 'correct' ? '✓ Correct!' : '✗ Not quite'}
                      </p>
                      <p className="text-xs mt-1">
                        {feedback === 'correct'
                          ? 'You identified the primary speaker'
                          : 'Listen more carefully to speaker prominence'}
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
                    <span className="font-semibold">Training Tip:</span> In real environments, your brain uses spatial cues to focus on one speaker while ignoring others (cocktail party effect).
                  </p>
                </div>
              </Card>

              {/* Difficulty Info */}
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <p className="text-xs font-semibold text-emerald-700 mb-2">ENVIRONMENT DIFFICULTY</p>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full transition-colors ${
                        i < envInfo.difficulty ? 'bg-emerald-600' : 'bg-emerald-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-emerald-700 mt-2">
                  {envInfo.reverbTime > 1
                    ? 'High reverberation - sound bounces off surfaces'
                    : 'Low reverberation - controlled environment'}
                </p>
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
