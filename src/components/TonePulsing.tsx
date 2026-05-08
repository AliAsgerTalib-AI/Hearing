import React, { useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from './ui/basic';
import { AudioEngine } from '../lib/AudioEngine';

interface TonePulsingProps {
  frequency: number;
  currentDb: number;
  maxDb: number;
  isTonePlaying: boolean;
  onPlayTone: () => void;
  onHeard: () => void;
  onNotHeard: () => void;
  testHistory: { db: number; heard: boolean }[];
}

const TonePulsingComponent: React.FC<TonePulsingProps> = ({
  frequency,
  currentDb,
  maxDb,
  isTonePlaying,
  onPlayTone,
  onHeard,
  onNotHeard,
  testHistory
}) => {
  return (
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
          <span className="text-4xl font-serif text-primary">{frequency}</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-accent-sage mt-1">Hertz</span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold">Can you hear this?</h3>
        <p className="text-sm text-accent-sage">ML Estimate: {currentDb} dB SPL</p>
        <div className="flex gap-1 justify-center mt-2">
          {testHistory.slice(-5).map((h, i) => (
            <div key={i} className={`w-1 h-1 rounded-full ${h.heard ? 'bg-teal-400' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={onPlayTone}
            disabled={isTonePlaying}
            className="flex items-center justify-center gap-2 h-14"
          >
            <Play size={18} fill="currentColor" /> Play
          </Button>
          <Button onClick={onHeard} className="flex items-center justify-center gap-2 h-14">
            <CheckCircle2 size={18} /> I Hear It
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={onNotHeard}
          disabled={isTonePlaying}
          className="w-full text-slate-500 border border-slate-100 h-16 text-sm flex flex-col items-center justify-center gap-1 shadow-sm active:bg-slate-50"
        >
          <span className="font-semibold">{currentDb >= maxDb ? "No Response" : "I can't hear it"}</span>
          <span className="text-[10px] uppercase font-bold opacity-40">{currentDb >= maxDb ? "Next Frequency" : "Increase Volume"}</span>
        </Button>
      </div>
    </div>
  );
};

export const TonePulsing = React.memo(TonePulsingComponent);
