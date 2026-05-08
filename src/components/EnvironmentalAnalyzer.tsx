import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, AlertCircle, Info, Activity } from 'lucide-react';
import { Card, Button } from './ui/basic';
import { useStorage } from '../contexts/StorageContext';
import { useDebouncedState } from '../hooks/useDebounce';
import { useCanvasResize, useCanvasDimensions } from '../hooks/useCanvasResize';

export const EnvironmentalAnalyzer = () => {
  const { testResults } = useStorage();
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, []);

  const startAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      source.connect(analyser);
      setIsActive(true);
      setError(null);
      
      draw();
    } catch (err) {
      console.error("Mic access error:", err);
      setError("Microphone access denied. Please enable it in your browser settings.");
    }
  };

  const stopAnalysis = () => {
    isDrawingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
  };

  const [peakFreq, setPeakFreq] = useState(0);
  const [peakDb, setPeakDb] = useState(-100);
  const [, setCanvasResized] = useState(0); // Trigger re-render on canvas resize

  // Debounce peak frequency and dB updates to avoid excessive React reconciliation
  // Only update state max every 100ms even if values change every frame (60fps)
  const debouncedSetPeakFreq = useDebouncedState(setPeakFreq, 100);
  const debouncedSetPeakDb = useDebouncedState(setPeakDb, 100);

  // Use ResizeObserver for efficient canvas resize handling (instead of checking every frame)
  // This hook only triggers when the canvas element actually resizes
  useCanvasResize(canvasRef, () => {
    setCanvasResized(prev => prev + 1);
  });

  // Get current canvas dimensions (updated when resize happens)
  const canvasDims = useCanvasDimensions(canvasRef);

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || isDrawingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    isDrawingRef.current = true;
    const renderFrame = () => {
      if (!isDrawingRef.current) return;
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyser.getFloatFrequencyData(dataArray);

      // Get current canvas dimensions (ResizeObserver handles updates)
      const logicalWidth = canvasDims.logicalWidth;
      const logicalHeight = canvasDims.logicalHeight;

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // UI Config
      const padding = { top: 30, bottom: 50, left: 50, right: 15 };
      const chartWidth = logicalWidth - padding.left - padding.right;
      const chartHeight = logicalHeight - padding.top - padding.bottom;

      // Constants for human hearing range
      const HUMAN_HEARING_MIN = 20;  // Hz - lower limit of human hearing
      const HUMAN_HEARING_MAX = 20000; // Hz - upper limit of human hearing
      const MAX_FREQ_DISPLAY = 20000;  // Display full range up to 20kHz

      // Draw Grid & Axes
      ctx.strokeStyle = '#f1f5f9';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 10px Inter';
      ctx.textAlign = 'right';

      // Y-axis (dB) - From -100 to 0 with major and minor ticks
      const dBMajorSteps = [-100, -75, -50, -25, 0];
      const dBMinorSteps = [-95, -90, -85, -80, -70, -65, -60, -55, -45, -40, -35, -30, -20, -15, -10, -5];

      // Minor dB ticks (faint)
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      dBMinorSteps.forEach(db => {
        const y = padding.top + chartHeight - ((db + 100) / 100) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + 5, y);
        ctx.stroke();
      });

      // Major dB ticks and gridlines
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      dBMajorSteps.forEach(db => {
        const y = padding.top + chartHeight - ((db + 100) / 100) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
        ctx.fillText(`${db}`, padding.left - 8, y + 3);
      });

      // X-axis (Frequency) with major and minor ticks
      ctx.textAlign = 'center';
      const sampleRate = audioContextRef.current?.sampleRate || 44100;

      // Major frequency ticks (labeled)
      const freqMajorSteps = [20, 50, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 20000];

      // Minor frequency ticks (unlabeled) - more granular
      const freqMinorSteps = [25, 75, 150, 300, 600, 1500, 3000, 6000, 12000];

      // Minor frequency ticks
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      freqMinorSteps.forEach(freq => {
        const x = padding.left + (freq / MAX_FREQ_DISPLAY) * chartWidth;
        if (x >= padding.left && x <= padding.left + chartWidth) {
          ctx.beginPath();
          ctx.moveTo(x, padding.top + chartHeight);
          ctx.lineTo(x, padding.top + chartHeight + 5);
          ctx.stroke();
        }
      });

      // Major frequency ticks and gridlines
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      freqMajorSteps.forEach(freq => {
        const x = padding.left + (freq / MAX_FREQ_DISPLAY) * chartWidth;
        if (x >= padding.left && x <= padding.left + chartWidth) {
          ctx.beginPath();
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, padding.top + chartHeight);
          ctx.stroke();

          // Label
          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 10px Inter';
          ctx.fillText(freq >= 1000 ? `${(freq/1000).toFixed(0)}k` : freq.toString(), x, padding.top + chartHeight + 20);
        }
      });

      // Draw vertical red lines marking the normal human hearing range
      // Left boundary: 20 Hz
      const x20Hz = padding.left + (HUMAN_HEARING_MIN / MAX_FREQ_DISPLAY) * chartWidth;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line
      ctx.beginPath();
      ctx.moveTo(x20Hz, padding.top);
      ctx.lineTo(x20Hz, padding.top + chartHeight);
      ctx.stroke();

      // Right boundary: 20 kHz
      const x20kHz = padding.left + (HUMAN_HEARING_MAX / MAX_FREQ_DISPLAY) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x20kHz, padding.top);
      ctx.lineTo(x20kHz, padding.top + chartHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label the hearing range boundaries
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('20 Hz', x20Hz, padding.top + 12);
      ctx.fillText('20 kHz', x20kHz, padding.top + 12);

      // Draw real-time spectrum
      ctx.beginPath();
      ctx.strokeStyle = '#0d9488';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';

      let maxVal = -Infinity;
      let maxFreqIdx = 0;

      for (let i = 0; i < bufferLength; i++) {
        const db = dataArray[i];
        const freq = (i * sampleRate) / (bufferLength * 2);

        if (freq > MAX_FREQ_DISPLAY) break;

        const x = padding.left + (freq / MAX_FREQ_DISPLAY) * chartWidth;
        const y = padding.top + chartHeight - ((db + 100) / 100) * chartHeight;

        if (db > maxVal) {
          maxVal = db;
          maxFreqIdx = i;
        }

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Update peak state with debouncing to avoid excessive React reconciliation
      // Instead of random polling (~5% of frames = ~3 updates/sec at 60fps),
      // use timer-based debouncing (max once per 100ms = 10 updates/sec max)
      const currentPeakFreq = Math.round((maxFreqIdx * sampleRate) / (bufferLength * 2));
      debouncedSetPeakFreq(currentPeakFreq);
      debouncedSetPeakDb(Math.round(maxVal));

      // Overlay Hearing Loss Mask
      if (testResults.length > 0) {
        const combinedResults = testResults.reduce((acc, current) => {
          if (!acc[current.freq] || current.side === 'both') {
            acc[current.freq] = current.db;
          } else {
            acc[current.freq] = (acc[current.freq] + current.db) / 2;
          }
          return acc;
        }, {} as Record<number, number>);

        const sortedFreqs = Object.keys(combinedResults).map(Number).sort((a, b) => a - b);

        ctx.beginPath();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.moveTo(padding.left, padding.top + chartHeight);

        sortedFreqs.forEach((freq, i) => {
          const x = padding.left + (freq / MAX_FREQ_DISPLAY) * chartWidth;
          const lossDb = combinedResults[freq];
          // Scale lossDb (20-85 clinically) to chart's 0-100dB range
          const y = padding.top + chartHeight - ((lossDb) / 85) * chartHeight;

          if (x <= padding.left + chartWidth) {
            ctx.lineTo(x, y);
          }
        });

        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.closePath();
        ctx.fill();
        
        // Intensity Label
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'left';
        ctx.font = 'bold 9px Inter';
        ctx.fillText('LOSS PROFILE', padding.left + 5, padding.top + chartHeight - 5);
      }
    };
    
    renderFrame();
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif">Acoustic Insights</h1>
        <p className="text-accent-sage">Real-time spectral analysis mapped to your clinical audiometric profile.</p>
      </div>

      <Card className="flex-1 min-h-[350px] relative overflow-hidden flex flex-col p-0">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={400} 
          className="w-full h-full bg-white"
        />
        
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-slate-100 shadow-sm flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-teal-600">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />
            {isActive ? 'Wideband Capture' : 'Stopped'}
          </div>
        </div>

        {!isActive && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm space-y-4">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-primary">
              <Mic size={32} />
            </div>
            <Button onClick={startAnalysis} variant="primary">
              Initialize Analysis
            </Button>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 backdrop-blur-sm p-6 text-center space-y-4">
            <AlertCircle className="text-red-500" size={48} />
            <div className="space-y-1">
              <h4 className="font-bold text-red-900">Access Denied</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button onClick={startAnalysis} variant="secondary">
              Retry Access
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-1">
             <div className="text-[10px] uppercase font-bold text-teal-600 tracking-tighter">Dominant Frequency</div>
             <div className="text-xl font-serif">{isActive ? `${peakFreq} Hz` : '---'}</div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-1">
             <div className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">Peak Intensity</div>
             <div className="text-xl font-serif">{isActive ? `${peakDb} dB` : '---'}</div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex gap-4">
           <Info className="text-blue-500 shrink-0" size={24} />
           <div className="space-y-1">
             <h4 className="text-sm font-bold text-blue-900">Interpretation</h4>
             <p className="text-xs text-blue-800 leading-relaxed">
               The chart shows frequency (low to high) on the X-axis and volume (quiet to loud) on the Y-axis. The red zone indicates where your threshold limit may cause you to miss environmental details.
             </p>
           </div>
        </div>

        {isActive && (
          <Button onClick={stopAnalysis} variant="secondary" className="w-full flex items-center justify-center gap-2">
            <MicOff size={18} /> Stop Analysis
          </Button>
        )}
      </div>
    </div>
  );
};
