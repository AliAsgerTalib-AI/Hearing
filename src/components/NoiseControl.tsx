import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, ChevronDown } from 'lucide-react';
import { NoiseType, NOISE_PRESETS } from '../lib/NoiseSimulator';
import { Card, Button } from './ui/basic';

interface NoiseControlProps {
  selectedNoise: NoiseType;
  noiseLevel: number;
  onNoiseTypeChange: (noiseType: NoiseType) => void;
  onNoiseLevelChange: (level: number) => void;
  compact?: boolean;
}

export const NoiseControl: React.FC<NoiseControlProps> = ({
  selectedNoise,
  noiseLevel,
  onNoiseTypeChange,
  onNoiseLevelChange,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const noiseInfo = NOISE_PRESETS[selectedNoise];

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-700 uppercase">Noise</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{noiseInfo.name}</p>
            <p className="text-xs text-slate-500">{noiseLevel}dB</p>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="60"
          value={noiseLevel}
          onChange={(e) => onNoiseLevelChange(Number(e.target.value))}
          className="w-full accent-slate-400"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-slate-600" />
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">{noiseInfo.name}</p>
            <p className="text-xs text-slate-500">{noiseInfo.realWorldExample}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
          <ChevronDown size={18} className="text-slate-400 group-hover:text-slate-600" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 space-y-4">
              {/* Description */}
              <p className="text-sm text-slate-600">{noiseInfo.description}</p>

              {/* Noise Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase">Noise Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(NOISE_PRESETS) as NoiseType[]).map((noiseType) => {
                    const preset = NOISE_PRESETS[noiseType];
                    return (
                      <button
                        key={noiseType}
                        onClick={() => onNoiseTypeChange(noiseType)}
                        className={`p-2 rounded-lg transition-all text-sm font-medium ${
                          selectedNoise === noiseType
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <div>{preset.name}</div>
                        <div className="text-[10px] opacity-75">Level {preset.difficulty}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Noise Level Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Noise Level</label>
                  <span className="text-sm font-bold text-slate-900">{noiseLevel}dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={noiseLevel}
                  onChange={(e) => onNoiseLevelChange(Number(e.target.value))}
                  className="w-full accent-slate-900"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Silent</span>
                  <span>Very Loud</span>
                </div>
              </div>

              {/* Difficulty Indicator */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-2">DIFFICULTY</p>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full transition-colors ${
                        i < noiseInfo.difficulty ? 'bg-slate-900' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-900">
                  <span className="font-semibold">Tip:</span> Start at lower noise levels and gradually increase as accuracy improves.
                </p>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setIsExpanded(false)}
                variant="secondary"
                className="w-full"
              >
                Done
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
