import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UtensilsCrossed, Volume2 } from 'lucide-react';
import { RestaurantOrderScenario, OrderTrial } from '../../lib/scenarios/RestaurantOrderScenario';
import { SoundCoinBadge } from './SoundCoinBadge';
import { EnvironmentMap } from './EnvironmentMap';
import { useScenario } from '../../contexts/ScenarioContext';
import { calculateCoinReward } from '../../types/scenarios';

interface RestaurantOrderSessionProps {
  audioContext: AudioContext;
  spatialEngine: any;
  onClose: () => void;
  difficulty: number;
}

type SessionPhase = 'intro' | 'playing' | 'answering' | 'feedback' | 'complete';

export function RestaurantOrderSession({
  audioContext,
  spatialEngine,
  onClose,
  difficulty,
}: RestaurantOrderSessionProps) {
  const { awardCoins } = useScenario();
  const [phase, setPhase] = useState<SessionPhase>('intro');
  const [scenario] = useState(() => new RestaurantOrderScenario(audioContext, spatialEngine));
  const [currentTrial, setCurrentTrial] = useState<OrderTrial | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [trialsCount, setTrialsCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const startTrial = async () => {
    const trial = scenario.generateTrial(difficulty);
    setCurrentTrial(trial);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setPhase('playing');

    await scenario.playTrial(trial);
    setPhase('answering');
  };

  const handleAnswerSelect = (order: string) => {
    if (!currentTrial) return;

    const correct = scenario.checkAnswer(currentTrial, order);
    setSelectedAnswer(order);
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
      awardCoins(coins, `Complete Restaurant Order (Difficulty ${difficulty})`, 'restaurant_order');
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
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <UtensilsCrossed size={24} />
              <h2 className="text-xl font-bold">Restaurant Order</h2>
            </div>
            <SoundCoinBadge balance={0} size="sm" />
          </div>
          <p className="text-sm opacity-90">Listen to the waiter and identify the order</p>
        </div>

        {/* Content */}
        <div className="p-6 min-h-96 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-4">
                  <p className="text-slate-700">
                    The waiter will call out a menu item in a busy restaurant. Listen carefully and select what you
                    heard from the options below.
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>Difficulty:</strong> Level {difficulty}
                  </p>
                  <EnvironmentMap environment="restaurant" interactiveMode="display-only" />
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-900">
                      💡 Tip: Focus on the front-right area where the waiter is standing. Background cocktail noise
                      will increase with difficulty.
                    </p>
                  </div>
                </div>
                <button
                  onClick={startTrial}
                  className="mt-8 w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-shadow"
                >
                  Start Trial
                </button>
              </motion.div>
            )}

            {phase === 'playing' && (
              <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <Volume2 size={48} className="text-orange-500" />
                </motion.div>
                <p className="text-slate-700 font-medium">Listening to waiter...</p>
                <p className="text-sm text-slate-600">Trial {trialsCount + 1} of 5</p>
              </motion.div>
            )}

            {phase === 'answering' && currentTrial && (
              <motion.div key="answering" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-slate-700 font-medium mb-4">What was the order?</p>
                <div className="grid grid-cols-1 gap-2">
                  {currentTrial.options.map(order => (
                    <button
                      key={order}
                      onClick={() => handleAnswerSelect(order)}
                      className="p-3 rounded-lg border-2 border-slate-300 hover:border-orange-500 hover:bg-orange-50 transition-colors font-medium text-slate-700 hover:text-orange-600 text-left capitalize"
                    >
                      {order}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === 'feedback' && (
              <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-4">
                {isCorrect ? (
                  <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl">
                      ✅
                    </motion.div>
                    <p className="text-lg font-bold text-green-600">Correct!</p>
                  </>
                ) : (
                  <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl">
                      ❌
                    </motion.div>
                    <p className="text-lg font-bold text-red-600">Incorrect</p>
                    <p className="text-sm text-slate-600 capitalize">The correct order was: {currentTrial?.targetOrder}</p>
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
                  🎉
                </motion.div>
                <p className="text-2xl font-bold text-slate-900">Excellent!</p>
                <p className="text-lg text-slate-600">
                  Accuracy: <strong>{((correctCount / trialsCount) * 100).toFixed(0)}%</strong>
                </p>
                <p className="text-sm text-amber-600 font-semibold">
                  +{calculateCoinReward((correctCount / trialsCount) * 100, difficulty)} SoundCoins
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:shadow-lg transition-shadow font-semibold"
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
