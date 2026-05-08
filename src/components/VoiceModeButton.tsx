import { Mic, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface VoiceModeButtonProps {
  isListening: boolean;
  isProcessing?: boolean;
  error: string | null;
  interimTranscript?: string;
  onTap: () => void;
  disabled?: boolean;
}

export function VoiceModeButton({
  isListening,
  isProcessing = false,
  error,
  interimTranscript = '',
  onTap,
  disabled = false,
}: VoiceModeButtonProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center max-w-sm">
          <div className="flex items-center justify-center gap-2 text-red-700 text-sm font-medium mb-2">
            <AlertCircle className="w-4 h-4" />
            Voice Recognition
          </div>
          <p className="text-red-600 text-xs leading-relaxed">{error}</p>
        </div>
        <p className="text-xs text-gray-500">Try using the answer buttons below.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        onClick={onTap}
        disabled={disabled || isProcessing}
        className={cn(
          'relative h-20 w-20 rounded-full flex items-center justify-center transition-all',
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
            : 'bg-white border-2 border-teal-400 text-teal-600 hover:border-teal-500 hover:bg-teal-50',
          (disabled || isProcessing) && 'opacity-50 cursor-not-allowed'
        )}
        whileHover={{ scale: !disabled && !isProcessing ? 1.05 : 1 }}
        whileTap={{ scale: !disabled && !isProcessing ? 0.95 : 1 }}
        aria-label={isListening ? 'Stop listening' : 'Tap to speak your answer'}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : isListening ? (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-300"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ) : null}
        <Mic className="w-8 h-8 relative z-10" />
      </motion.button>

      {isListening && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-medium text-gray-600 animate-pulse">Listening...</p>
          {interimTranscript && (
            <p className="text-xs text-gray-500 italic text-center max-w-xs">
              {interimTranscript}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
