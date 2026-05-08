import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, Button } from './ui/basic';

interface NoiseCheckProps {
  onPass: (db: number) => void;
  onRetry: () => void;
}

export const NoiseCheck = ({ onPass, onRetry }: NoiseCheckProps) => {
  const [ambientDb, setAmbientDb] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const startMeasurement = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Convert to a rough dB scale for UI feedback (normalized 0-100)
        // This is not scientific SPL but relative to full scale
        const dbValue = Math.min(Math.round(average * 0.8), 100);
        setAmbientDb(dbValue);
        animationRef.current = requestAnimationFrame(update);
      };

      update();

      // Measure for 3 seconds then stop automatically if it's quiet
      setTimeout(() => {
        setIsMeasuring(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }, 4000);

    } catch (err) {
      setError("Microphone access denied. We need this to check background noise.");
      setIsMeasuring(false);
    }
  };

  useEffect(() => {
    startMeasurement();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const isQuietEnough = ambientDb < 45;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-colors duration-500 ${isQuietEnough ? 'bg-teal-50 text-accent-teal' : 'bg-amber-50 text-amber-600'}`}>
          {isMeasuring ? <Mic className="animate-pulse" size={40} /> : (isQuietEnough ? <CheckCircle2 size={40} /> : <MicOff size={40} />)}
        </div>
        <h2 className="text-3xl font-serif">Environment Check</h2>
        <p className="text-accent-sage text-base">We're measuring the noise in your room.</p>
      </div>

      <Card className="p-8 flex flex-col items-center gap-6">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * ambientDb) / 100}
              className={`transition-all duration-300 ${isQuietEnough ? 'text-accent-teal' : 'text-amber-500'}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-serif">{ambientDb}</span>
            <span className="text-sm uppercase tracking-widest font-bold text-accent-sage">Decibels</span>
          </div>
        </div>

        {isMeasuring ? (
          <div className="flex items-center gap-3 text-slate-400 text-base italic">
            <Loader2 size={20} className="animate-spin" />
            Sampling background sounds...
          </div>
        ) : (
          <div className="text-center">
            {isQuietEnough ? (
              <p className="text-accent-teal font-semibold text-lg">Perfectly quiet. Ready to proceed.</p>
            ) : (
              <p className="text-amber-600 font-semibold text-lg">Room is a bit loud. Try a quieter spot.</p>
            )}
          </div>
        )}
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-100 p-4 flex gap-3 text-red-800 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </Card>
      )}

      <div className="flex flex-col gap-4">
        <Button
          disabled={isMeasuring || (!isQuietEnough && !error)}
          onClick={() => onPass(ambientDb)}
          className="w-full h-16 text-lg"
        >
          {isQuietEnough ? 'Start Calibration' : 'Continue Anyway'}
        </Button>
        <Button variant="ghost" onClick={onRetry} className="w-full h-16 text-lg text-slate-400">
          Re-check Noise Level
        </Button>
      </div>
    </motion.div>
  );
};
