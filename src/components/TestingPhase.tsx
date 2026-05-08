import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { audioEngine, AudioEngine } from '../lib/AudioEngine';
import { TonePulsing } from './TonePulsing';
import { Progress } from './ui/progress';
import { Button } from './ui/basic';

interface TestResult {
  side: 'left' | 'right' | 'both';
  freq: number;
  db: number;
}

interface TestingPhaseProps {
  frequencies: number[];
  sides: ('left' | 'right' | 'both')[];
  currentFreqIdx: number;
  currentSideIdx: number;
  currentDb: number;
  testHistory: { db: number; heard: boolean }[];
  maxDb: number;
  minDb: number;
  onResponse: (heard: boolean, ceilingReached?: boolean) => void;
  onFinishEarly: () => void;
  onThresholdFound: (result: TestResult) => void;
}

const TestingPhaseComponent: React.FC<TestingPhaseProps> = ({
  frequencies,
  sides,
  currentFreqIdx,
  currentSideIdx,
  currentDb,
  testHistory,
  maxDb,
  minDb,
  onResponse,
  onFinishEarly,
  onThresholdFound
}) => {
  const [isTonePlaying, setIsTonePlaying] = useState(false);
  const currentFrequency = frequencies[currentFreqIdx];
  const currentSide = sides[currentSideIdx];
  const pan = currentSide === 'left' ? -1 : currentSide === 'right' ? 1 : 0;

  const totalTests = frequencies.length * sides.length;
  const currentTestCount = currentSideIdx * frequencies.length + currentFreqIdx + 1;
  const progress = (currentTestCount / totalTests) * 100;

  const playCheckTone = useCallback(async () => {
    if (isTonePlaying) return;

    await audioEngine.resume();
    setIsTonePlaying(true);
    const gain = AudioEngine.dbToGain(currentDb);
    audioEngine.playPulsedTone(frequencies[currentFreqIdx], gain, pan);

    setTimeout(() => {
      setIsTonePlaying(false);
    }, 1500);
  }, [currentFreqIdx, currentDb, pan, isTonePlaying]);

  const handleUserHeard = useCallback(() => {
    if (isTonePlaying) return;
    onResponse(true);
  }, [isTonePlaying, onResponse]);

  const handleIncreaseVolume = useCallback(() => {
    if (isTonePlaying) return;
    onResponse(false, currentDb >= maxDb);
  }, [isTonePlaying, currentDb, maxDb, onResponse]);

  return (
    <motion.div
      key="testing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col space-y-8"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <div className="text-xs uppercase font-bold tracking-widest text-accent-teal">Current Phase</div>
            <div className="text-4xl font-serif capitalize">{currentSide} Ear</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase font-bold tracking-widest text-accent-sage">Progress</div>
            <div className="text-xl font-medium">
              {currentTestCount} / {totalTests}
            </div>
          </div>
        </div>
        <Progress value={progress} />
      </div>

      <TonePulsing
        frequency={currentFrequency}
        currentDb={currentDb}
        maxDb={maxDb}
        isTonePlaying={isTonePlaying}
        onPlayTone={playCheckTone}
        onHeard={handleUserHeard}
        onNotHeard={handleIncreaseVolume}
        testHistory={testHistory}
      />

      <Button
        variant="ghost"
        onClick={onFinishEarly}
        className="w-full text-slate-400 h-14 text-sm uppercase tracking-widest font-bold"
      >
        Finish & Analyze Results
      </Button>
    </motion.div>
  );
};

export const TestingPhase = React.memo(TestingPhaseComponent);
