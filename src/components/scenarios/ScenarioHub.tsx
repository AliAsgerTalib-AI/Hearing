import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Lock, Zap, Award, Users, Utensils, Map } from 'lucide-react';
import { useScenario } from '../../contexts/ScenarioContext';
import { SoundscapeSimulator } from '../../lib/SoundscapeSimulator';
import { SpatialAudioEngine } from '../../lib/SpatialAudioEngine';
import { NoiseSimulator } from '../../lib/NoiseSimulator';
import { SoundCoinBadge } from './SoundCoinBadge';
import { ReceptionistSession } from './ReceptionistSession';
import { RestaurantOrderSession } from './RestaurantOrderSession';
import { NavigationSession } from './NavigationSession';
import { ENVIRONMENT_UNLOCK_COSTS, ENVIRONMENT_DIFFICULTY, EnvironmentId, ScenarioId } from '../../types/scenarios';
import { SoundscapeSimulator as SoundscapeSimulatorType, ENVIRONMENTS } from '../../lib/SoundscapeSimulator';

interface ScenarioHubProps {
  onClose: () => void;
}

export function ScenarioHub({ onClose }: ScenarioHubProps) {
  const scenarioCtx = useScenario();
  const [activeScenario, setActiveScenario] = useState<{ id: ScenarioId; difficulty: number } | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [spatialEngine, setSpatialEngine] = useState<SpatialAudioEngine | null>(null);
  const [noiseSimulator, setNoiseSimulator] = useState<NoiseSimulator | null>(null);

  // Initialize audio engines on mount
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const spatial = new SpatialAudioEngine(ctx);
    const noise = new NoiseSimulator(ctx);

    setAudioContext(ctx);
    setSpatialEngine(spatial);
    setNoiseSimulator(noise);

    return () => {
      noise.dispose();
      spatial.dispose();
    };
  }, []);

  const scenarios = [
    {
      id: 'receptionist' as ScenarioId,
      name: 'Receptionist Game',
      description: 'Listen to phone calls and identify the caller',
      icon: Users,
      color: 'from-rose-500 to-pink-600',
      stats: scenarioCtx.getScenarioProgress('receptionist'),
    },
    {
      id: 'restaurant_order' as ScenarioId,
      name: 'Restaurant Order',
      description: 'Hear waiter orders in a busy restaurant',
      icon: Utensils,
      color: 'from-orange-500 to-amber-600',
      stats: scenarioCtx.getScenarioProgress('restaurant_order'),
    },
    {
      id: 'navigation' as ScenarioId,
      name: 'Navigation',
      description: 'Follow audio directions to your destination',
      icon: Map,
      color: 'from-violet-500 to-indigo-600',
      stats: scenarioCtx.getScenarioProgress('navigation'),
    },
  ];

  const environments = [
    { id: 'restaurant' as EnvironmentId, name: 'Restaurant', difficulty: 1 },
    { id: 'airport' as EnvironmentId, name: 'Airport', difficulty: 2 },
    { id: 'subway' as EnvironmentId, name: 'Subway', difficulty: 3 },
    { id: 'concert_hall' as EnvironmentId, name: 'Concert Hall', difficulty: 4 },
    { id: 'times_square' as EnvironmentId, name: 'Times Square', difficulty: 5 },
  ];

  const handleUnlock = (envId: EnvironmentId) => {
    if (scenarioCtx.canAfford(envId)) {
      scenarioCtx.spendCoins(envId);
    }
  };

  const handleStartScenario = (scenarioId: ScenarioId, difficulty: number) => {
    setActiveScenario({ id: scenarioId, difficulty });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={e => e.stopPropagation()}
      >
        <motion.div className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 sticky top-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Globe size={28} />
                <div>
                  <h2 className="text-2xl font-bold">Immersive Experiences</h2>
                  <p className="text-sm opacity-90">Real-world auditory training scenarios</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex justify-center">
              <SoundCoinBadge balance={scenarioCtx.coins} animated size="lg" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Environments Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Zap size={20} className="text-amber-500" />
                Unlock Environments
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {environments.map(env => {
                  const isUnlocked = scenarioCtx.isEnvironmentUnlocked(env.id);
                  const cost = ENVIRONMENT_UNLOCK_COSTS[env.id];
                  const canAfford = scenarioCtx.canAfford(env.id);

                  return (
                    <motion.button
                      key={env.id}
                      onClick={() => !isUnlocked && canAfford && handleUnlock(env.id)}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        isUnlocked
                          ? 'border-green-400 bg-green-50 hover:bg-green-100'
                          : canAfford
                            ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                            : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
                      }`}
                      whileHover={!isUnlocked && canAfford ? { scale: 1.05 } : {}}
                      whileTap={!isUnlocked && canAfford ? { scale: 0.95 } : {}}
                    >
                      {isUnlocked ? (
                        <>
                          <p className="font-semibold text-slate-900">{env.name}</p>
                          <p className="text-xs text-green-600 font-bold">✓ Unlocked</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-slate-900">{env.name}</p>
                          <p className="text-xs text-slate-600">
                            <Lock size={12} className="inline mr-1" />
                            {cost} coins
                          </p>
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Scenarios Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award size={20} className="text-purple-500" />
                Choose Your Challenge
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {scenarios.map(scenario => {
                  const Icon = scenario.icon;
                  const difficulty = 1 + Math.floor(Math.random() * 5); // Random difficulty

                  return (
                    <motion.div
                      key={scenario.id}
                      className={`bg-gradient-to-r ${scenario.color} text-white p-6 rounded-lg shadow-lg`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white/20 rounded-lg">
                            <Icon size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{scenario.name}</h4>
                            <p className="text-sm opacity-90">{scenario.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        {scenario.stats ? (
                          <div className="text-sm">
                            <p>
                              <strong>{scenario.stats.completions}</strong> completions
                            </p>
                            <p>Best: {scenario.stats.bestAccuracy.toFixed(0)}%</p>
                          </div>
                        ) : (
                          <p className="text-sm opacity-75">Not started yet</p>
                        )}

                        <button
                          onClick={() => handleStartScenario(scenario.id, difficulty)}
                          className="px-4 py-2 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Start
                        </button>
                      </div>

                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(d => (
                          <motion.div
                            key={d}
                            className={`flex-1 h-2 rounded ${d <= difficulty ? 'bg-yellow-300' : 'bg-white/30'}`}
                            animate={d === difficulty ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Active Session Overlay */}
        <AnimatePresence>
          {activeScenario && audioContext && spatialEngine && noiseSimulator && (
            <>
              {activeScenario.id === 'receptionist' && (
                <ReceptionistSession
                  audioContext={audioContext}
                  onClose={() => setActiveScenario(null)}
                  difficulty={activeScenario.difficulty}
                />
              )}
              {activeScenario.id === 'restaurant_order' && (
                <RestaurantOrderSession
                  audioContext={audioContext}
                  spatialEngine={spatialEngine}
                  onClose={() => setActiveScenario(null)}
                  difficulty={activeScenario.difficulty}
                />
              )}
              {activeScenario.id === 'navigation' && (
                <NavigationSession
                  audioContext={audioContext}
                  spatialEngine={spatialEngine}
                  onClose={() => setActiveScenario(null)}
                  difficulty={activeScenario.difficulty}
                />
              )}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
