import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Card, Button } from './ui/basic';
import { AudiogramChart } from './AudiogramChart';
import { ContraindicationReport } from './ContraindicationReport';
import { calculateThresholds } from '../lib/utils';
import { buildReferenceChartData, interpretAgainstISO7029 } from '../lib/iso7029';
import { analyzeFrequencyPattern, interpretFrequencyPattern } from '../lib/frequencyWeighting';
import { TestResult } from '../types/index';

interface ResultsDisplayProps {
  results: TestResult[];
  demographics: { age: number; sex: 'male' | 'female' | 'other' } | null;
  device: string | null;
  onReturnHome: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  demographics,
  device,
  onReturnHome
}) => {
  const { avgLeft, avgRight } = calculateThresholds(results);

  const hasHighFrequencyLoss = results.some(r => r.freq >= 8000 && r.db >= 60);

  // Compute ISO 7029 reference data for age/sex
  const sortedFreqs: number[] = Array.from(new Set(results.map(r => r.freq))).sort((a, b) => (a as number) - (b as number)) as number[];
  const referenceData = demographics
    ? buildReferenceChartData(demographics.age, demographics.sex, sortedFreqs)
    : undefined;

  // Analyze frequency pattern
  const freqPattern = analyzeFrequencyPattern(
    results.map(r => ({ frequency: r.freq, db: r.db }))
  );
  const patternInterpretation = interpretFrequencyPattern(freqPattern.pattern);

  return (
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
          {device && ` using ${device.replace('_', ' ')}`}.
        </p>
      </div>

      <Card className="p-0 overflow-hidden space-y-0">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <h4 className="font-bold text-[10px] uppercase tracking-widest text-accent-sage">
            Interactive Audiogram Results
          </h4>
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
          <AudiogramChart results={results} referenceData={referenceData} />
        </div>
        <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50/30 border-t border-slate-100">
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Avg. Threshold (L)</div>
            <div className="text-lg font-serif">{avgLeft} dB</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Avg. Threshold (R)</div>
            <div className="text-lg font-serif">{avgRight} dB</div>
          </div>
        </div>
      </Card>

      <div className="bg-primary text-white rounded-2xl p-6 space-y-3 shadow-xl">
        <h4 className="font-semibold flex items-center gap-2 text-accent-teal">
          <Sparkles size={16} /> Clinical Interpretation
        </h4>
        <div className="text-xs leading-relaxed opacity-90 space-y-2">
          <p>{patternInterpretation}</p>
          {hasHighFrequencyLoss && (
            <p className="text-red-200 font-medium tracking-tight">
              Significant high-frequency attenuation detected. 80dB at 8000Hz is a CRITICAL LOSS indicator. This requires
              immediate clinical verification by an Audiologist.
            </p>
          )}
          <p className="border-t border-white/10 pt-2 text-[10px] opacity-60">
            Note: This is a screening tool, not a diagnostic device. Always consult a licensed Audiologist for formal diagnosis.
            80dB is the hardware safety ceiling. Any "No Response" at this level is clinically significant.
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
        <Button onClick={onReturnHome} variant="primary" className="w-full">
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
  );
};
