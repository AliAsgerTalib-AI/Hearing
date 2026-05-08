import { useEffect, useRef, useState } from 'react';

export type SpeechRecognitionErrorType =
  | 'not-supported'
  | 'permission-denied'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'other';

export interface SpeechRecognitionState {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  error: SpeechRecognitionErrorType | null;
  isSupported: boolean;
}

export interface SpeechRecognitionControls {
  startListening: (lang?: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

type SpeechRecognitionInstance = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  language: string;
  onstart: (() => void) | null;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SpeechRecognitionAPI ? new SpeechRecognitionAPI() : null;
}

export function useSpeechRecognition(): SpeechRecognitionState & SpeechRecognitionControls {
  const [state, setState] = useState<SpeechRecognitionState>({
    transcript: '',
    interimTranscript: '',
    isListening: false,
    error: null,
    isSupported: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (!state.isSupported) return;

    const recognition = getSpeechRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
      finalTranscriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        interimTranscript: interim,
        transcript: finalTranscriptRef.current.trim(),
      }));
    };

    recognition.onerror = (event: any) => {
      const errorMap: Record<string, SpeechRecognitionErrorType> = {
        'not-allowed': 'permission-denied',
        'no-speech': 'no-speech',
        'network': 'network',
        'aborted': 'aborted',
      };

      const errorType: SpeechRecognitionErrorType = (errorMap[event.error] as SpeechRecognitionErrorType) || 'other';

      setState(prev => ({
        ...prev,
        error: errorType,
        isListening: false,
      }));
    };

    recognition.onend = () => {
      setState(prev => ({
        ...prev,
        isListening: false,
        interimTranscript: '',
      }));
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, [state.isSupported]);

  const startListening = (lang = 'en-US') => {
    if (!recognitionRef.current || !state.isSupported) return;

    finalTranscriptRef.current = '';
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      error: null,
    }));

    recognitionRef.current.language = lang;
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  };

  const resetTranscript = () => {
    finalTranscriptRef.current = '';
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
    }));
  };

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
  };
}
