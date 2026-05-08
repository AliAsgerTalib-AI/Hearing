import { useCallback, useEffect, useRef, useState } from 'react';
import { ExerciseType, matchPhoneme } from '../lib/phonemeMatching';
import { VOICE_RECOGNITION } from '../lib/constants';
import { useSpeechRecognition } from './useSpeechRecognition';

interface UseVoiceModeOptions {
  exerciseType: ExerciseType;
  validAnswers: string[];
  onMatch: (answerId: string, confidence: 'exact' | 'fuzzy') => void;
  onNoMatch: () => void;
}

export interface UseVoiceModeReturn {
  isVoiceMode: boolean;
  setIsVoiceMode: (v: boolean) => void;
  isListening: boolean;
  interimTranscript: string;
  voiceError: string | null;
  isSupported: boolean;
  startListening: () => void;
  perPhonemeAccuracy: Record<string, { correct: number; total: number }>;
}

export function useVoiceMode(options: UseVoiceModeOptions): UseVoiceModeReturn {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [perPhonemeAccuracy, setPerPhonemeAccuracy] = useState<Record<string, { correct: number; total: number }>>({});

  const { transcript, interimTranscript, isListening, error, isSupported, startListening: speechStart, stopListening } = useSpeechRecognition();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (!transcript) return;

    if (processedRef.current) return;
    processedRef.current = true;

    const result = matchPhoneme(transcript, options.exerciseType, options.validAnswers);

    if (result.matched && (result.confidence === 'exact' || result.confidence === 'fuzzy')) {
      setVoiceError(null);
      options.onMatch(result.matched, result.confidence);

      setPerPhonemeAccuracy(prev => {
        const phoneme = result.matched!;
        return {
          ...prev,
          [phoneme]: {
            correct: (prev[phoneme]?.correct ?? 0) + 1,
            total: (prev[phoneme]?.total ?? 0) + 1,
          },
        };
      });
    } else {
      const phonemesInTranscript = options.validAnswers.filter(p =>
        transcript.toLowerCase().includes(p.toLowerCase())
      );

      if (phonemesInTranscript.length > 0) {
        for (const p of phonemesInTranscript) {
          setPerPhonemeAccuracy(prev => ({
            ...prev,
            [p]: {
              correct: prev[p]?.correct ?? 0,
              total: (prev[p]?.total ?? 0) + 1,
            },
          }));
        }
      } else {
        options.validAnswers.forEach(p => {
          setPerPhonemeAccuracy(prev => ({
            ...prev,
            [p]: {
              correct: prev[p]?.correct ?? 0,
              total: (prev[p]?.total ?? 0) + 1,
            },
          }));
        });
      }

      setVoiceError('Didn\'t catch that clearly. Try again or use buttons.');
      options.onNoMatch();
    }

    stopListening();
  }, [transcript, options]);

  useEffect(() => {
    if (error) {
      const errorMessages: Record<string, string> = {
        'permission-denied': 'Microphone access was denied. Please allow microphone access in browser settings.',
        'no-speech': 'We didn\'t hear anything. Try speaking closer to your microphone.',
        'network': 'Voice recognition is temporarily unavailable.',
        'not-supported': 'Voice recognition is not supported on this browser.',
        'aborted': 'Speech recognition was interrupted.',
      };

      setVoiceError(errorMessages[error] || 'An error occurred with voice recognition.');
      stopListening();
    }
  }, [error, stopListening]);

  useEffect(() => {
    if (!isListening) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    processedRef.current = false;

    timeoutRef.current = setTimeout(() => {
      if (isListening) {
        stopListening();
        setVoiceError('No speech detected. Try again or use buttons.');
        options.onNoMatch();
      }
    }, VOICE_RECOGNITION.LISTEN_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isListening, stopListening, options]);

  const startListening = useCallback(() => {
    processedRef.current = false;
    setVoiceError(null);
    speechStart(VOICE_RECOGNITION.DEFAULT_LANG);
  }, [speechStart]);

  return {
    isVoiceMode,
    setIsVoiceMode,
    isListening,
    interimTranscript,
    voiceError,
    isSupported,
    startListening,
    perPhonemeAccuracy,
  };
}
