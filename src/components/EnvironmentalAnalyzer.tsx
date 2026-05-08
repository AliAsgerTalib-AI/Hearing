import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, AlertCircle, Info, Activity } from 'lucide-react';
import { Card, Button } from './ui/basic';

interface TestResult {
  side: 'left' | 'right' | 'both';
  freq: number;
  db: number;
}

export const EnvironmentalAnalyzer = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Load existing results
    const stored = localStorage.getItem('hearingTestResults');
    if (stored) {
      try {
        setResults(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse results", e);
      }
    }

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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsActive(false);
  };

  const [peakFreq, setPeakFreq] = useState(0);
  const [peakDb, setPeakDb] = useState(-100);

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    
    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyser.getFloatFrequencyData(dataArray);
      
      // Handle High DPI displays and Resizing reactively
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const logicalWidth = rect.width;
      const logicalHeight = rect.height;

      if (canvas.width !== logicalWidth * dpr || canvas.height !== logicalHeight * dpr) {
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        ctx.scale(dpr, dpr);
      }
      
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // UI Config
      const padding = { top: 30, bottom: 40, left: 45, right: 15 };
      const chartWidth = logicalWidth - padding.left - padding.right;
      const chartHeight = logicalHeight - padding.top - padding.bottom;
      
      // Draw Grid & Axes
      ctx.strokeStyle = '#f1f5f9';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 10px Inter';
      ctx.textAlign = 'right';

      // Y-axis (dB) - From -100 to 0
      const dBSteps = [-100, -75, -50, -25, 0];
      dBSteps.forEach(db => {
        const y = padding.top + chartHeight - ((db + 100) / 100) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
        ctx.fillText(`${db}`, padding.left - 8, y + 3);
      });

      // X-axis (Frequency)
      ctx.textAlign = 'center';
      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      const maxFreqVisible = 10000; // Standard audiometer range
      const freqSteps = [125, 1000, 4000, 8000, 10000];
      
      freqSteps.forEach(freq => {
        const x = padding.left + (freq / maxFreqVisible) * chartWidth;
        if (x <= padding.left + chartWidth) {
          ctx.beginPath();
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, padding.top + chartHeight);
          ctx.stroke();
          ctx.fillText(freq >= 1000 ? `${freq/1000}k` : freq.toString(), x, padding.top + chartHeight + 15);
        }
      });

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
        
        if (freq > maxFreqVisible) break;

        const x = padding.left + (freq / maxFreqVisible) * chartWidth;
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

      // Update peak state infrequently to avoid React thrashing
      const currentPeakFreq = Math.round((maxFreqIdx * sampleRate) / (bufferLength * 2));
      if (Math.random() > 0.95) { 
        setPeakFreq(currentPeakFreq);
        setPeakDb(Math.round(maxVal));
      }

      // Overlay Hearing Loss Mask
      if (results.length > 0) {
        const combinedResults = results.reduce((acc, current) => {
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
          const x = padding.left + (freq / maxFreqVisible) * chartWidth;
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
