import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, ChevronRight, Play, Info, CheckCircle2, RotateCcw, Sparkles, Headphones } from 'lucide-react';
import { Card, Button } from './ui/basic';
import { Progress } from './ui/progress';
import { NoiseCheck } from './NoiseCheck';
import { SafetyScreen } from './SafetyScreen';
import { DemographicsScreen } from './DemographicsScreen';
import { ContraindicationReport } from './ContraindicationReport';
import { DeviceCalibration, DeviceType } from './DeviceCalibration';
import { AudiogramChart } from './AudiogramChart';
import { audioEngine, AudioEngine } from '../lib/AudioEngine';

// ML-inspired Frequency Ordering (Anchor -> Detail -> Extremes)
const FREQUENCIES = [1000, 4000, 500, 8000, 2000, 250, 12000, 125, 16000];
const SIDES: ('left' | 'right' | 'both')[] = ['left', 'right', 'both'];
const MAX_DB = 80;
const MIN_DB = 0;

interface TestResult {
  side: 'left' | 'right' | 'both';
  freq: number;
  db: number;
}

export interface HearingHistoryEntry {
  id: string;
  date: string;
  demographics: Demographics | null;
  device: DeviceType | null;
  results: TestResult[];
  avgLeft: number;
  avgRight: number;
}

interface TestState {
  currentDb: number;
  lastResponse: boolean | null;
  ascendingCount: number;
  confirmedThreshold: number | null;
  history: { db: number; heard: boolean }[];
}

interface Demographics {
  age: number;
  sex: 'male' | 'female' | 'other';
}

export const HearingTest = () => {
  const [step, setStep] = useState<'intro' | 'safety' | 'demographics' | 'noise' | 'calibration' | 'side-prep' | 'testing' | 'results'>('intro');
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [currentFreqIdx, setCurrentFreqIdx] = useState(0);
  const [currentSideIdx, setCurrentSideIdx] = useState(0);
  const [currentDb, setCurrentDb] = useState(25);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testState, setTestState] = useState<TestState>({
    currentDb: 25,
    lastResponse: null,
    ascendingCount: 0,
    confirmedThreshold: null,
    history: []
  });
  const [isTonePlaying, setIsTonePlaying] = useState(false);
  const [envNoise, setEnvNoise] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioEngine.dispose();
    };
  }, []);

  const startTest = async () => {
    setStep('safety');
  };

  const confirmSafety = () => {
    setStep('demographics');
  };

  const handleDemographicsComplete = (data: Demographics) => {
    setDemographics(data);
    localStorage.setItem('hearingDemographics', JSON.stringify(data));
    setStep('noise');
  };

  const handleNoisePass = (db: number) => {
    setEnvNoise(db);
    setStep('calibration');
  };

  const handleCalibrationPass = (device: DeviceType, nc: boolean) => {
    audioEngine.setDeviceCalibration(device, nc);
    setSelectedDevice(device);
    setStep('side-prep');
    setCurrentFreqIdx(0);
    setCurrentSideIdx(0);
    setCurrentDb(20);
  };

  const currentSide = SIDES[currentSideIdx];
  const pan = currentSide === 'left' ? -1 : currentSide === 'right' ? 1 : 0;

  const playCheckTone = useCallback(async () => {
    if (isTonePlaying) return;
    
    await audioEngine.resume();
    setIsTonePlaying(true);
    const gain = AudioEngine.dbToGain(currentDb);
    audioEngine.playPulsedTone(FREQUENCIES[currentFreqIdx], gain, pan);
    
    setTimeout(() => {
      setIsTonePlaying(false);
    }, 1500);
  }, [currentFreqIdx, currentDb, pan, isTonePlaying]);

  /**
   * MLAG-Estimation: Predicts the starting dB for a frequency based on 
   * demographics (age/sex), frequency-specific norms, and neighboring results.
   */
  const predictStartingDb = (freq: number, side: string, existingResults: TestResult[]) => {
    // 1. Calculate Age-Adjusted Base Threshold (Simple Presbycusis Model)
    // Hearing typically declines by ~0.5dB to 1.5dB per year after 20, 
    // accelerated at higher frequencies.
    const age = demographics?.age || 30;
    const isMale = demographics?.sex === 'male';
    const ageFactor = Math.max(0, age - 20);
    
    // Frequency-specific decline rates (dB per decade above 20)
    let declineRate = 0.5; // Default for low frequencies (< 1kHz)
    if (freq >= 8000) declineRate = 2.5;
    else if (freq >= 4000) declineRate = 1.8;
    else if (freq >= 2000) declineRate = 1.2;
    else if (freq >= 1000) declineRate = 0.8;

    // Men typically experience faster high-frequency decline
    const sexAdjustment = (isMale && freq >= 2000) ? 1.2 : 1.0;
    
    // Base predicted threshold (Standard median is ~10dB for young adults)
    const baseNorm = 10 + (ageFactor * declineRate * sexAdjustment);
    
    // 2. Adjust for existing context (Neighboring Frequencies)
    const sideResults = existingResults.filter(r => r.side === side);
    
    if (sideResults.length > 0) {
      const neighbors = sideResults.sort((a, b) => Math.abs(a.freq - freq) - Math.abs(b.freq - freq));
      const nearest = neighbors[0];
      
      // Weight the prediction: 60% neighbor performance, 40% demographic norm
      // This helps account for both individual variance and population trends
      const weightedStart = (nearest.db * 0.6) + (baseNorm * 0.4);
      
      // Start slightly above predicted threshold to ensure first tone is likely audible
      return Math.min(MAX_DB - 10, Math.max(MIN_DB + 5, Math.round(weightedStart + 10)));
    }

    // No neighbors yet, use demographic norm + buffer
    return Math.min(MAX_DB - 10, Math.max(MIN_DB + 5, Math.round(baseNorm + 15)));
  };

  const saveSession = (currentResults: TestResult[]) => {
    const avgLeft = Math.round(currentResults.filter(r => r.side === 'left').reduce((acc, curr) => acc + curr.db, 0) / (currentResults.filter(r => r.side === 'left').length || 1));
    const avgRight = Math.round(currentResults.filter(r => r.side === 'right').reduce((acc, curr) => acc + curr.db, 0) / (currentResults.filter(r => r.side === 'right').length || 1));

    const newEntry: HearingHistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      demographics,
      device: selectedDevice,
      results: currentResults,
      avgLeft,
      avgRight
    };

    const existingHistoryRaw = localStorage.getItem('hearingTestHistory');
    const existingHistory: HearingHistoryEntry[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];
    
    const updatedHistory = [newEntry, ...existingHistory].slice(0, 50); // Keep last 50
    localStorage.setItem('hearingTestHistory', JSON.stringify(updatedHistory));
    localStorage.setItem('hearingTestResults', JSON.stringify(currentResults)); // Keep for immediate results view
  };

  const moveToNextFrequency = (currentResults: TestResult[]) => {
    if (currentFreqIdx < FREQUENCIES.length - 1) {
      const nextFreq = FREQUENCIES[currentFreqIdx + 1];
      const nextStartDb = predictStartingDb(nextFreq, currentSide, currentResults);
      
      setCurrentFreqIdx(prev => prev + 1);
      setCurrentDb(nextStartDb);
      setTestState({
        currentDb: nextStartDb,
        lastResponse: null,
        ascendingCount: 0,
        confirmedThreshold: null,
        history: []
      });
    } else if (currentSideIdx < SIDES.length - 1) {
      const nextSide = SIDES[currentSideIdx + 1];
      const nextFreq = FREQUENCIES[0];
      const nextStartDb = predictStartingDb(nextFreq, nextSide, currentResults);

      setCurrentSideIdx(prev => prev + 1);
      setCurrentFreqIdx(0);
      setCurrentDb(nextStartDb);
      setTestState({
        currentDb: nextStartDb,
        lastResponse: null,
        ascendingCount: 0,
        confirmedThreshold: null,
        history: []
      });
      setStep('side-prep');
    } else {
      saveSession(currentResults);
      setStep('results');
    }
  };

  /**
   * MLAG Adaptive Staircase:
   * Uses a "Down 10, Up 5" pattern (Modified Hughson-Westlake)
   * Accelerated by predictive starting points.
   */
  const handleHearIt = (heard: boolean, ceilingReached = false) => {
    const nextHistory = [...testState.history, { db: currentDb, heard }];
    
    // Check if we've found a threshold
    // Simple criteria: 2nd time hearing at the same level during an ascent
    let confirmedThreshold: number | null = null;
    
    if (heard) {
      // If they hear it, we drop 10dB to find the true floor
      const nextDb = Math.max(MIN_DB, currentDb - 10);
      
      // Verification logic: if we just came up from a non-response and hit this again, confirm
      const wasAscending = testState.lastResponse === false;
      const previouslyHeardAtThisLevel = testState.history.some(h => h.db === currentDb && h.heard);
      
      if (wasAscending && previouslyHeardAtThisLevel) {
        confirmedThreshold = currentDb;
      } else {
        // Continue seeking floor
        setCurrentDb(nextDb);
        setTestState({
          ...testState,
          currentDb: nextDb,
          lastResponse: true,
          history: nextHistory
        });
        return;
      }
    } else {
      // If they don't hear it, we rise 5dB
      const nextDb = Math.min(MAX_DB, currentDb + 5);
      
      if (ceilingReached || currentDb >= MAX_DB) {
        confirmedThreshold = MAX_DB + 5; // Mark as NR (No Response)
      } else {
        setCurrentDb(nextDb);
        setTestState({
          ...testState,
          currentDb: nextDb,
          lastResponse: false,
          history: nextHistory
        });
        return;
      }
    }

    // If we've confirmed a threshold for this frequency
    if (confirmedThreshold !== null) {
      const newResult: TestResult = { 
        side: currentSide, 
        freq: FREQUENCIES[currentFreqIdx], 
        db: confirmedThreshold
      };
      const updatedResults = [...results, newResult];
      setResults(updatedResults);
      moveToNextFrequency(updatedResults);
    }
  };

  const handleIncreaseVolume = useCallback(async () => {
    if (isTonePlaying) return;
    handleHearIt(false);
  }, [currentFreqIdx, currentDb, pan, isTonePlaying, testState, handleHearIt]);

  const handleUserHeard = async () => {
    if (isTonePlaying) return;
    handleHearIt(true);
  };

  const finishEarly = () => {
    saveSession(results);
    setStep('results');
  };

  const currentFrequency = FREQUENCIES[currentFreqIdx];
  const totalTests = FREQUENCIES.length * SIDES.length;
  const currentTestCount = (currentSideIdx * FREQUENCIES.length) + currentFreqIdx + 1;
  const progress = (currentTestCount / totalTests) * 100;

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
            
            <div className="space-y-3">
              <h1 className="text-3xl font-serif">Pure Tone Check-up</h1>
              <p className="text-accent-sage">Find a quiet environment and use your best quality headphones for an accurate reading.</p>
            </div>

            <Card className="text-left space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="font-medium">Instructions</h4>
                  <p className="text-sm text-slate-500">We will play tones at different frequencies. Gradually increase the volume until you can just barely hear the pulse.</p>
                </div>
              </div>
            </Card>

            <Button onClick={startTest} className="w-full">
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

        {step === 'side-prep' && (
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

            <div className="space-y-2">
              <h2 className="text-3xl font-serif capitalize">{currentSide} Ear Test</h2>
              <p className="text-accent-sage max-w-[280px] mx-auto">
                {currentSide === 'both' 
                  ? "We will now test both ears simultaneously to assess binaural balance."
                  : `Please focus your attention on your ${currentSide} ear.`}
              </p>
            </div>

            <div className="flex flex-col w-full gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-500 uppercase font-bold tracking-widest border border-slate-100 italic">
                 Ensure your headphones are correctly oriented
               </div>
               <Button onClick={() => setStep('testing')} className="h-16 text-lg w-full">
                 Start {currentSide} Ear Sweep
               </Button>
            </div>
          </motion.div>
        )}

        {step === 'testing' && (
          <motion.div
            key="testing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col space-y-8"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <div className="text-[10px] uppercase font-bold tracking-widest text-accent-teal">Current Phase</div>
                   <div className="text-2xl font-serif capitalize">{currentSide} Ear</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-accent-sage">Progress</div>
                  <div className="text-sm font-medium">{currentTestCount} / {totalTests}</div>
                </div>
              </div>
              <Progress value={progress} />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <motion.div 
                  animate={isTonePlaying ? { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] } : {}}
                  transition={{ duration: 1.2, repeat: isTonePlaying ? Infinity : 0 }}
                  className="absolute inset-0 bg-accent-teal/20 rounded-full -m-8"
                />
                <div className="w-40 h-40 bg-white border border-slate-100 shadow-2xl rounded-full flex flex-col items-center justify-center relative z-10 transition-all">
                  <div className="absolute -top-2 bg-primary text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-slate-800 flex items-center gap-1">
                    <Sparkles size={8} className="text-accent-teal" /> MLAG Active
                  </div>
                  <span className="text-4xl font-serif text-primary">{currentFrequency}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-accent-sage mt-1">Hertz</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold">Can you hear this?</h3>
                <p className="text-sm text-accent-sage">ML Estimate: {currentDb} dB SPL</p>
                <div className="flex gap-1 justify-center mt-2">
                  {testState.history.slice(-5).map((h, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${h.heard ? 'bg-teal-400' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="secondary" 
                  onClick={playCheckTone}
                  disabled={isTonePlaying}
                  className="flex items-center justify-center gap-2 h-14"
                >
                  <Play size={18} fill="currentColor" /> Play
                </Button>
                <Button onClick={handleUserHeard} className="flex items-center justify-center gap-2 h-14">
                  <CheckCircle2 size={18} /> I Hear It
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={handleIncreaseVolume} 
                disabled={isTonePlaying}
                className="w-full text-slate-500 border border-slate-100 h-16 text-sm flex flex-col items-center justify-center gap-1 shadow-sm active:bg-slate-50"
              >
                <span className="font-semibold">{currentDb >= MAX_DB ? "No Response" : "I can't hear it"}</span>
                <span className="text-[10px] uppercase font-bold opacity-40">{currentDb >= MAX_DB ? "Next Frequency" : "Increase Volume"}</span>
              </Button>
            </div>

              <Button 
                variant="ghost" 
                onClick={finishEarly}
                className="w-full text-slate-400 h-10 text-[10px] uppercase tracking-widest font-bold"
              >
                Finish & Analyze Results
              </Button>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2 pt-6">
              <div className="inline-flex items-center justify-center text-teal-600 mb-2">
                <CheckCircle2 size={48} strokeWidth={1} />
              </div>
              <h1 className="text-3xl font-serif">Assessment Complete</h1>
              <p className="text-accent-sage">
                Comprehensive hearing profile created for {demographics?.age}y {demographics?.sex} 
                {selectedDevice && ` using ${selectedDevice.replace('_', ' ')}`}.
              </p>
            </div>

            <Card className="p-0 overflow-hidden space-y-0">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-accent-sage">Interactive Audiogram Results</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 grayscale opacity-60">
                    <div className="w-2 h-0.5 bg-blue-500 rounded-full" />
                    <span className="text-[9px] font-bold text-blue-900">LEFT</span>
                  </div>
                  <div className="flex items-center gap-1.5 grayscale opacity-60">
                    <div className="w-2 h-0.5 bg-red-500 rounded-full" />
                    <span className="text-[9px] font-bold text-red-900">RIGHT</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white">
                <AudiogramChart results={results} />
              </div>
              <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50/30 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Avg. Threshold (L)</div>
                  <div className="text-lg font-serif">
                    {Math.round(results.filter(r => r.side === 'left').reduce((acc, curr) => acc + curr.db, 0) / (results.filter(r => r.side === 'left').length || 1))} dB
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Avg. Threshold (R)</div>
                  <div className="text-lg font-serif">
                    {Math.round(results.filter(r => r.side === 'right').reduce((acc, curr) => acc + curr.db, 0) / (results.filter(r => r.side === 'right').length || 1))} dB
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-primary text-white rounded-2xl p-6 space-y-3 shadow-xl">
              <h4 className="font-semibold flex items-center gap-2 text-accent-teal">
                <Sparkles size={16} /> Clinical Interpretation
              </h4>
              <div className="text-xs leading-relaxed opacity-90 space-y-2">
                {results.some(r => r.freq >= 8000 && r.db >= 60) ? (
                  <p className="text-red-200 font-medium tracking-tight">Significant high-frequency attenuation detected. 80dB at 8000Hz is a CRITICAL LOSS indicator. This is not "strong" hearing; it requires immediate clinical verification by an Audiologist.</p>
                ) : (
                  <p>Your auditory response appears within age-appropriate ranges. Consistent neuro-active training is recommended.</p>
                )}
                <p className="border-t border-white/10 pt-2 text-[10px] opacity-60">
                  Note: 80dB is the hardware safety ceiling. Any "No Response" at this level is clinically significant.
                </p>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <h3 className="text-lg font-serif mb-4">Technical Clinical Audit</h3>
              <div className="text-[11px] text-slate-500 space-y-4 leading-relaxed bg-slate-50 p-6 rounded-3xl">
                <section className="space-y-1">
                  <h4 className="font-bold text-slate-700 uppercase tracking-tighter">1. Spectral Purity</h4>
                  <p>Pure tone stim uses a 50ms nonlinear ramp to suppress "transient clicks," preventing false-positives from broad-spectrum energy bursts during onset.</p>
                </section>
                <section className="space-y-1">
                  <h4 className="font-bold text-slate-700 uppercase tracking-tighter">2. SNR Optimization</h4>
                  <p>Pulsed 400ms tones help the auditory system isolate signal from temporal noise floor (hiss) through envelope modulation detection.</p>
                </section>
                <section className="space-y-1">
                  <h4 className="font-bold text-slate-700 uppercase tracking-tighter">3. Calibration & 80dB Ceiling</h4>
                  <p>80dB is enforced as a hardware safety ceiling to prevent permanent threshold shift (PTS) and hardware clipping in consumer-grade transducers. Any "No Response" (NR) at 80dB is clinically significant.</p>
                </section>
              </div>
            </div>

            <ContraindicationReport />

            <div className="space-y-4">
              <Button onClick={() => setStep('intro')} variant="primary" className="w-full">
                Return Home
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest"
              >
                Scroll to Safety Alerts ↓
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
