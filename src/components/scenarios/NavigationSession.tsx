import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Volume2, MapPin } from 'lucide-react';
import { NavigationScenario, NavigationTrial } from '../../lib/scenarios/NavigationScenario';
import { SoundCoinBadge } from './SoundCoinBadge';
import { EnvironmentMap } from './EnvironmentMap';
import { Vector3 } from '../../lib/SpatialAudioEngine';
import { useScenario } from '../../contexts/ScenarioContext';
import { calculateCoinReward } from '../../types/scenarios';

interface NavigationSessionProps {
  audioContext: AudioContext;
  spatialEngine: any;
  onClose: () => void;
  difficulty: number;
}

type SessionPhase = 'intro' | 'playing' | 'answering' | 'feedback' | 'complete';

export function NavigationSession({
  audioContext,
  spatialEngine,
  onClose,
  difficulty,
}: NavigationSessionProps) {
  const { awardCoins } = useScenario();
  const [phase, setPhase] = useState<SessionPhase>('intro');
  const [scenario] = useState(() => new NavigationScenario(audioContext, spatialEngine));
  const [currentTrial, setCurrentTrial] = useState<NavigationTrial | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [trialsCount, setTrialsCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const startTrial = async () => {
    const trial = scenario.generateTrial(difficulty);
    setCurrentTrial(trial);
    setSelectedZoneId(null);
    setIsCorrect(null);
    setPhase('playing');
    setIsPlaying(true);

    await scenario.playNavigationAudio(trial.steps);
    setIsPlaying(false);
    setPhase('answering');
  };

  const handleZoneTap = (zoneId: string, _worldPos: Vector3) => {
    if (!currentTrial) return;

    const correct = scenario.checkAnswer(currentTrial, zoneId);
    setSelectedZoneId(zoneId);
    setIsCorrect(correct);
    setTrialsCount(prev => prev + 1);
    if (correct) setCorrectCount(prev => prev + 1);
    setPhase('feedback');
  };

  const nextOrComplete = () => {
    if (trialsCount < 5) {
      startTrial();
    } else {
      const accuracy = (correctCount / trialsCount) * 100;
      const coins = calculateCoinReward(accuracy, difficulty);
      awardCoins(coins, `Complete Navigation (Difficulty ${difficulty})`, 'navigation');
      setPhase('complete');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Map size={24} />
              <h2 className="text-xl font-bold">Navigation</h2>
            </div>
            <SoundCoinBadge balance={0} size="sm" />
          </div>
          <p className="text-sm opacity-90">Follow the audio directions and tap your destination</p>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[500px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-4">
                  <p className="text-slate-700">
                    You'll hear a series of directional tones in a subway station. Each tone indicates a direction to
                    follow. Once you hear the completion chime, tap on the zone where you end up.
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>Difficulty:</strong> Level {difficulty} ({2 + difficulty - 1} steps)
                  </p>
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                    <p className="text-sm text-violet-900">
                      💡 Directions: North (↑), Northeast (↗), East (→), Southeast (↘), South (↓), Southwest (↙), West
                      (←), Northwest (↖)
                    </p>
                  </div>
                </div>
                <button
                  onClick={startTrial}
                  className="mt-8 w-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-shadow"
                >
                  Start Trial
                </button>
              </motion.div>
            )}

            {phase === 'playing' && (
              <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <Volume2 size={48} className="text-violet-500" />
                </motion.div>
                <p className="text-slate-700 font-medium">Follow the directions...</p>
                <p className="text-sm text-slate-600">Trial {trialsCount + 1} of 5</p>
              </motion.div>
            )}

            {phase === 'answering' && currentTrial && (
              <motion.div key="answering" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-slate-700 font-medium mb-4">Where did you end up? Tap on the zone:</p>
                <EnvironmentMap
                  environment="subway"
                  onZoneTap={handleZoneTap}
                  interactiveMode="navigation-answer"
                  isPlaying={isPlaying}
                />
              </motion.div>
            )}

            {phase === 'feedback' && currentTrial && (
              <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4">
                {isCorrect ? (
                  <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl">
                      ✅
                    </motion.div>
                    <p className="text-lg font-bold text-green-600">Perfect Navigation!</p>
                  </>
                ) : (
                  <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl">
                      ❌
                    </motion.div>
                    <p className="text-lg font-bold text-red-600">Wrong destination</p>
                    <p className="text-sm text-slate-600">
                      You selected{' '}
                      <strong>
                        {currentTrial.mapZones.find(z => z.id === selectedZoneId)?.name || 'Unknown'}
                      </strong>
                    </p>
                    <p className="text-sm text-slate-600">
                      Correct destination was{' '}
                      <strong>{currentTrial.mapZones.find(z => z.id === currentTrial.correctZoneId)?.name}</strong>
                    </p>
                  </>
                )}
                <button
                  onClick={nextOrComplete}
                  className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  {trialsCount < 5 ? 'Next' : 'Finish'}
                </button>
              </motion.div>
            )}

            {phase === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl">
                  🧭
                </motion.div>
                <p className="text-2xl font-bold text-slate-900">Navigation Master!</p>
                <p className="text-lg text-slate-600">
                  Accuracy: <strong>{((correctCount / trialsCount) * 100).toFixed(0)}%</strong>
                </p>
                <p className="text-sm text-indigo-600 font-semibold">
                  +{calculateCoinReward((correctCount / trialsCount) * 100, difficulty)} SoundCoins
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
                >
                  Back to Hub
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
