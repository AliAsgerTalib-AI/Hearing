import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, X, Music, Brain, Mic } from 'lucide-react';
import { Button, Card } from './ui/basic';
import { VowelDiscriminationExercise } from '../lib/VowelDiscriminationExercise';
import { useGamification } from '../contexts/GamificationContext';
import { useVoiceMode } from '../hooks/useVoiceMode';
import { VoiceModeButton } from './VoiceModeButton';
import { VoiceFeedbackSummary } from './VoiceFeedbackSummary';
import { Switch } from '@radix-ui/react-switch';

export interface VowelDiscriminationSessionProps {
  onClose: () => void;
}

export const VowelDiscriminationSession: React.FC<VowelDiscriminationSessionProps> = ({ onClose }) => {
  const [exercise] = useState(() => new VowelDiscriminationExercise());
  const [isPlaying, setIsPlaying] = useState(false);
  const [showingOptions, setShowingOptions] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [sessionStartTime] = useState(Date.now());
  const [currentTrial, setCurrentTrial] = useState<string | null>(null);
  const [showingSummary, setShowingSummary] = useState(false);
  const { recordSession } = useGamification();

  const state = exercise.getState();
  const levelConfig = exercise.getLevelConfig();
  const vowelSet = exercise.getCurrentVowelSet();
  const vowelExamples = exercise.getVowelExamples();

  const {
    isVoiceMode,
    setIsVoiceMode,
    isListening,
    interimTranscript,
    voiceError,
    isSupported,
    startListening,
    perPhonemeAccuracy,
  } = useVoiceMode({
    exerciseType: 'vowel',
    validAnswers: vowelSet.map((vn: string) => {
      const allChars = ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ'];
      const matchedChar = allChars.find(
        char => exercise['VOWELS' as any]?.find((v: any) => v.name === vn)?.char === char ||
        exercise['VOWELS_EXTENDED' as any]?.find((v: any) => v.name === vn)?.char === char
      );
      return matchedChar || 'a';
    }),
    onMatch: (answerId: string) => {
      handleResponse(answerId);
    },
    onNoMatch: () => {
      // Already handled in voice hook with error message
    },
  });

  const handlePlayTrial = async () => {
    setIsPlaying(true);
    setShowingOptions(false);
    setFeedback(null);

    try {
      const trial = exercise.generateTrial();
      setCurrentTrial(trial.vowel);
      await exercise.playTrial(trial);
    } finally {
      setIsPlaying(false);
      setShowingOptions(true);
    }
  };

  const handleResponse = (userAnswer: string) => {
    const correct = userAnswer === state.correctAnswer;
    exercise.recordResponse(userAnswer, correct);
    setFeedback(correct ? 'correct' : 'incorrect');

    setTimeout(() => {
      setFeedback(null);
      setShowingOptions(false);
    }, 1500);
  };

  const handleEndSession = () => {
    exercise.stop();

    // Record session if any trials were completed
    if (state.totalTrials > 0) {
      const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
      recordSession(
        1, // exerciseId for Vowel Discrimination
        'Vowel Discrimination',
        durationSeconds,
        state.accuracy,
        state.level
      );
    }

    if (Object.keys(perPhonemeAccuracy).length > 0) {
      setShowingSummary(true);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {sessionActive && !showingSummary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && handleEndSession()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Music className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Vowel Discrimination</h2>
                    <p className="text-xs opacity-90">Sound identification training</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSupported && (
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                      <Mic size={16} />
                      <Switch
                        checked={isVoiceMode}
                        onCheckedChange={setIsVoiceMode}
                        className="h-6 w-10 bg-white/30 rounded-full relative data-[state=checked]:bg-green-400 transition-colors"
                      />
                    </div>
                  )}
                  <button
                    onClick={handleEndSession}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Level Info */}
              <motion.div layout className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800">Level {state.level}</h3>
                    <p className="text-xs text-slate-500">{exercise.getLevelDescription()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{state.accuracy}%</p>
                    <p className="text-xs text-slate-500">Accuracy</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${state.accuracy}%` }}
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                    transition={{ type: 'spring', stiffness: 50, damping: 25 }}
                  />
                </div>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Noise Level</p>
                  <p className="text-lg font-bold text-blue-600">{state.noiseLevel}dB</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Trials</p>
                  <p className="text-lg font-bold text-blue-600">{state.totalTrials}</p>
                </Card>
              </div>

              {/* Current Vowel Display */}
              <motion.div
                animate={{ scale: showingOptions ? 1 : 0.95 }}
                className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200"
              >
                <p className="text-xs text-slate-500 mb-2">Last Vowel Heard:</p>
                <p className="text-5xl font-bold text-blue-600">
                  {currentTrial ? currentTrial : '—'}
                </p>
              </motion.div>

              {/* Main Exercise Area */}
              <div className="space-y-4">
                {/* Play Button */}
                <motion.div layout>
                  <Button
                    onClick={handlePlayTrial}
                    disabled={isPlaying || showingOptions}
                    className="w-full h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <Play size={24} />
                    {isPlaying ? 'Playing...' : 'Play Vowel Sound'}
                  </Button>
                </motion.div>

                {/* Response Options */}
                <AnimatePresence mode="wait">
                  {showingOptions && !feedback && (
                    <motion.div
                      key="options"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <p className="text-center text-slate-600 text-sm font-medium">
                        {isVoiceMode ? 'Speak the vowel sound you heard' : 'Which vowel sound did you hear?'}
                      </p>
                      {isVoiceMode ? (
                        <VoiceModeButton
                          isListening={isListening}
                          error={voiceError}
                          interimTranscript={interimTranscript}
                          onTap={startListening}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {vowelSet.map(vowelName => (
                            <motion.div key={vowelName} whileHover={{ scale: 1.05 }}>
                              <Button
                                onClick={() => {
                                  const vowelData = vowelSet.find(v => v === vowelName);
                                  // Find the character for this vowel name
                                  const allChars = ['a', 'e', 'i', 'o', 'u', 'ɑ', 'ɛ', 'ɪ', 'ɔ', 'ʊ'];
                                  const vowelExampleKeys = Object.keys(vowelExamples);
                                  const matchedChar = allChars.find(
                                    char => exercise['VOWELS' as any]?.find(
                                      (v: any) => v.name === vowelName
                                    )?.char === char ||
                                    exercise['VOWELS_EXTENDED' as any]?.find(
                                      (v: any) => v.name === vowelName
                                    )?.char === char
                                  );
                                  handleResponse(matchedChar || state.correctAnswer);
                                }}
                                className="w-full h-16 bg-slate-100 text-slate-700 hover:bg-blue-200 hover:text-blue-700 rounded-lg font-semibold text-lg transition-colors"
                              >
                                <div>
                                  <div className="text-sm">{vowelName}</div>
                                  <div className="text-xs opacity-75">({vowelExamples[vowelName] || ''})</div>
                                </div>
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {feedback && (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`p-4 rounded-xl text-center ${
                        feedback === 'correct'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <p className="font-semibold">
                        {feedback === 'correct' ? '✓ Excellent!' : '→ Keep trying!'}
                      </p>
                      <p className="text-xs mt-1">
                        {feedback === 'correct'
                          ? 'You identified the vowel correctly'
                          : `The answer was ${state.currentVowel}`}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Info Box */}
              <Card className="p-4 bg-slate-50 border-slate-200 space-y-2">
                <div className="flex gap-2 text-xs text-slate-600">
                  <Brain size={14} className="flex-shrink-0 mt-0.5" />
                  <p>
                    <span className="font-semibold">Vowel Tip:</span> Focus on how your mouth shape changes for each vowel. Each vowel has unique formant frequencies that your ear learns to recognize.
                  </p>
                </div>
              </Card>

              {/* Challenge Info */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-2">Current Challenge</p>
                <ul className="text-xs space-y-1 text-blue-600">
                  <li>• <span className="font-medium">{vowelSet.length} vowels</span> to distinguish</li>
                  <li>• <span className="font-medium">{state.noiseLevel}dB noise</span> in background</li>
                  <li>• <span className="font-medium">Vowels:</span> {vowelSet.join(', ')}</li>
                </ul>
              </Card>

              {/* End Session Button */}
              <Button
                onClick={handleEndSession}
                variant="secondary"
                className="w-full h-12 flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                End Session
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showingSummary && (
        <VoiceFeedbackSummary
          perPhonemeAccuracy={perPhonemeAccuracy}
          exerciseType="vowel"
          sessionDuration={Math.round((Date.now() - sessionStartTime) / 1000)}
          onClose={() => {
            setShowingSummary(false);
            setSessionActive(false);
            onClose();
          }}
        />
      )}
    </AnimatePresence>
  );
};
