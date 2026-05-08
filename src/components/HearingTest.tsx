import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Info, Headphones } from 'lucide-react';
import { Card, Button } from './ui/basic';
import { NoiseCheck } from './NoiseCheck';
import { SafetyScreen } from './SafetyScreen';
import { DemographicsScreen } from './DemographicsScreen';
import { ScreeningResponse } from '../types/contraindications';
import { DeviceCalibration } from './DeviceCalibration';
import { HearingHistoryEntry, TestResult, Demographics, DeviceType } from '../types/index';
import { audioEngine } from '../lib/AudioEngine';
import { TestingPhase } from './TestingPhase';
import { ResultsDisplay } from './ResultsDisplay';
import { useAdaptiveStaircase } from '../hooks/useAdaptiveStaircase';
import { calculateThresholds, enforceHistoryLimit } from '../lib/utils';
import { useStorage } from '../contexts/StorageContext';
import {
  FREQUENCY_DECLINE_RATES,
  FREQUENCY_THRESHOLDS,
  GENDER_ADJUSTMENTS,
  PRESBYCUSIS,
  PREDICTION_WEIGHTS,
  TEST_CONFIG,
  STORAGE,
  getDeclineRateForFrequency
} from '../lib/constants';

// Frequency Testing Order: Anchor -> Detail -> Extremes
// Based on ISO 8253-1 (Pure Tone Audiometry) and adaptive testing principles.
// Anchors (1000, 4000 Hz): Establish baseline in speech-frequency range (ISO standard reference)
// Details (500, 2000, 8000 Hz): Fill speech spectrum; 4000Hz critical for detecting noise-induced/age-related loss
// Extremes (250, 12000, 125, 16000 Hz): Test edge cases and identify frequency-specific loss patterns
// This ordering minimizes listener fatigue, prevents auditory adaptation, and provides psychological anchors.
const FREQUENCIES = TEST_CONFIG.FREQUENCIES;
const SIDES = TEST_CONFIG.SIDES;
const MAX_DB = TEST_CONFIG.MAX_DB;
const MIN_DB = TEST_CONFIG.MIN_DB;

export const HearingTest = () => {
  const [step, setStep] = useState<'intro' | 'safety' | 'demographics' | 'noise' | 'calibration' | 'side-prep' | 'testing' | 'results'>('intro');
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [currentFreqIdx, setCurrentFreqIdx] = useState(0);
  const [currentSideIdx, setCurrentSideIdx] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType | null>(null);

  const { history, updateHistory, updateTestResults } = useStorage();

  const staircaseHook = useAdaptiveStaircase({
    maxDb: MAX_DB,
    minDb: MIN_DB,
    startDb: 25
  });

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioEngine.dispose();
    };
  }, []);

  const startTest = async () => {
    setStep('safety');
  };

  const confirmSafety = (responses: ScreeningResponse) => {
    // Store screening responses if needed for future use
    if (responses) {
      sessionStorage.setItem('screeningResponses', JSON.stringify(responses));
    }
    setStep('demographics');
  };

  const handleDemographicsComplete = (data: Demographics) => {
    setDemographics(data);
    localStorage.setItem('hearingDemographics', JSON.stringify(data));
    setStep('noise');
  };

  const handleNoisePass = () => {
    setStep('calibration');
  };

  const handleCalibrationPass = (device: DeviceType, nc: boolean) => {
    audioEngine.setDeviceCalibration(device, nc);
    setSelectedDevice(device);
    setStep('side-prep');
    setCurrentFreqIdx(0);
    setCurrentSideIdx(0);
    staircaseHook.reset(20);
  };

  const predictStartingDb = (freq: number, side: string, existingResults: TestResult[]): number => {
    const age = demographics?.age || 30;
    const isMale = demographics?.sex === 'male';
    const ageFactor = Math.max(0, age - PRESBYCUSIS.DECLINE_START_AGE);

    const declineRate = getDeclineRateForFrequency(freq);
    const sexAdjustment = isMale && freq >= GENDER_ADJUSTMENTS.MALE_ADJUSTMENT_FREQ_CUTOFF
      ? GENDER_ADJUSTMENTS.MALE_HIGH_FREQ_MULTIPLIER
      : GENDER_ADJUSTMENTS.FEMALE;

    const baseNorm = PRESBYCUSIS.BASELINE_THRESHOLD_DB + ageFactor * declineRate * sexAdjustment;

    const sideResults = existingResults.filter(r => r.side === side);

    if (sideResults.length > 0) {
      const nearest = sideResults.sort((a, b) => Math.abs(a.freq - freq) - Math.abs(b.freq - freq))[0];
      const weightedStart =
        nearest.db * PREDICTION_WEIGHTS.NEIGHBOR_WEIGHT +
        baseNorm * PREDICTION_WEIGHTS.DEMOGRAPHIC_WEIGHT;
      return Math.min(
        MAX_DB - PREDICTION_WEIGHTS.MAX_DB_SAFETY_MARGIN,
        Math.max(
          MIN_DB + PREDICTION_WEIGHTS.MIN_START_DB,
          Math.round(weightedStart + PREDICTION_WEIGHTS.SAFETY_BUFFER_DB)
        )
      );
    }

    return Math.min(
      MAX_DB - PREDICTION_WEIGHTS.MAX_DB_SAFETY_MARGIN,
      Math.max(
        MIN_DB + PREDICTION_WEIGHTS.MIN_START_DB,
        Math.round(baseNorm + PREDICTION_WEIGHTS.SAFETY_BUFFER_DB + 5)
      )
    );
  };

  const saveSession = (currentResults: TestResult[]) => {
    const { avgLeft, avgRight } = calculateThresholds(currentResults);

    const now = Date.now();
    const newEntry: HearingHistoryEntry = {
      id: now.toString(),
      timestamp: now,
      date: new Date().toLocaleString(),
      demographics,
      device: selectedDevice,
      results: currentResults,
      avgLeft,
      avgRight
    };

    try {
      const updatedHistory = enforceHistoryLimit([newEntry, ...history], STORAGE.MAX_HISTORY_ENTRIES);
      updateHistory(updatedHistory);
      updateTestResults(currentResults);
    } catch (storageError) {
      console.error("Failed to save session:", storageError);
    }
  };

  const moveToNextFrequency = (currentResults: TestResult[]) => {
    const currentSide = SIDES[currentSideIdx];
    if (currentFreqIdx < FREQUENCIES.length - 1) {
      const nextFreq = FREQUENCIES[currentFreqIdx + 1];
      const nextStartDb = predictStartingDb(nextFreq, currentSide, currentResults);
      setCurrentFreqIdx(prev => prev + 1);
      staircaseHook.reset(nextStartDb);
    } else if (currentSideIdx < SIDES.length - 1) {
      const nextSide = SIDES[currentSideIdx + 1];
      const nextStartDb = predictStartingDb(FREQUENCIES[0], nextSide, currentResults);
      setCurrentSideIdx(prev => prev + 1);
      setCurrentFreqIdx(0);
      staircaseHook.reset(nextStartDb);
      setStep('side-prep');
    } else {
      saveSession(currentResults);
      setStep('results');
    }
  };

  const handleTestResponse = (heard: boolean, ceilingReached = false) => {
    const threshold = staircaseHook.handleResponse(heard, ceilingReached);

    if (threshold !== null) {
      const currentSide = SIDES[currentSideIdx];
      const newResult: TestResult = {
        side: currentSide,
        freq: FREQUENCIES[currentFreqIdx],
        db: threshold
      };
      const updatedResults = [...results, newResult];
      setResults(updatedResults);
      moveToNextFrequency(updatedResults);
    }
  };

  const finishEarly = () => {
    saveSession(results);
    setStep('results');
  };

  return (
    <div className="flex-1 p-6 space-y-6 flex flex-col h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 text-center pt-10"
          >
            <div className="w-24 h-24 bg-white shadow-xl rounded-3xl mx-auto flex items-center justify-center text-accent-teal">
              <Volume2 size={42} strokeWidth={1.5} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-serif">Pure Tone Check-up</h1>
              <p className="text-lg text-accent-sage">Find a quiet environment and use your best quality headphones for an accurate reading.</p>
            </div>

            <Card className="text-left space-y-4 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg text-slate-500">
                  <Info size={28} />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Instructions</h4>
                  <p className="text-base text-slate-500">We will play tones at different frequencies. Gradually increase the volume until you can just barely hear the pulse.</p>
                </div>
              </div>
            </Card>

            <Button onClick={startTest} className="w-full h-16 text-xl">
              Get Started
            </Button>
          </motion.div>
        )}

        {step === 'safety' && (
          <SafetyScreen 
            onAccept={confirmSafety}
            onCancel={() => setStep('intro')}
          />
        )}

        {step === 'demographics' && (
          <DemographicsScreen 
            onComplete={handleDemographicsComplete}
          />
        )}

        {step === 'noise' && (
          <NoiseCheck 
            onPass={handleNoisePass}
            onRetry={() => setStep('noise')}
          />
        )}

        {step === 'calibration' && (
          <DeviceCalibration 
            onSelect={handleCalibrationPass}
          />
        )}

        {step === 'side-prep' && (() => {
          const currentSide = SIDES[currentSideIdx];
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                currentSide === 'left' ? 'bg-blue-50 text-blue-600 border-l-8 border-blue-200' :
                currentSide === 'right' ? 'bg-red-50 text-red-600 border-r-8 border-red-200' :
                'bg-teal-50 text-teal-600 border-x-8 border-teal-200'
              }`}>
                 <Headphones size={64} strokeWidth={1} />
              </div>

              <div className="space-y-3">
                <h2 className="text-4xl font-serif capitalize">{currentSide} Ear Test</h2>
                <p className="text-lg text-accent-sage max-w-[280px] mx-auto">
                  {currentSide === 'both'
                    ? "We will now test both ears simultaneously to assess binaural balance."
                    : `Please focus your attention on your ${currentSide} ear.`}
                </p>
              </div>

              <div className="flex flex-col w-full gap-4">
                 <div className="p-5 bg-slate-50 rounded-2xl text-sm text-slate-500 uppercase font-bold tracking-widest border border-slate-100 italic">
                   Ensure your headphones are correctly oriented
                 </div>
                 <Button onClick={() => setStep('testing')} className="h-20 text-xl w-full">
                   Start {currentSide} Ear Sweep
                 </Button>
              </div>
            </motion.div>
          );
        })()}

        {step === 'testing' && (
          <TestingPhase
            frequencies={FREQUENCIES}
            sides={SIDES}
            currentFreqIdx={currentFreqIdx}
            currentSideIdx={currentSideIdx}
            currentDb={staircaseHook.state.currentDb}
            testHistory={staircaseHook.state.history}
            maxDb={MAX_DB}
            minDb={MIN_DB}
            onResponse={handleTestResponse}
            onFinishEarly={finishEarly}
            onThresholdFound={(result) => {
              const updatedResults = [...results, result];
              setResults(updatedResults);
              moveToNextFrequency(updatedResults);
            }}
          />
        )}

        {step === 'results' && (
          <ResultsDisplay
            results={results}
            demographics={demographics}
            device={selectedDevice}
            onReturnHome={() => setStep('intro')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
