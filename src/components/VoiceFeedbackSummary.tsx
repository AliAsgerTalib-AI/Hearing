import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Check } from 'lucide-react';
import { generateVoiceFeedback } from '../services/geminiService';
import { Button } from './ui/basic';

interface VoiceFeedbackSummaryProps {
  perPhonemeAccuracy: Record<string, { correct: number; total: number }>;
  exerciseType: 'vowel' | 'consonant';
  sessionDuration: number;
  onClose: () => void;
}

export function VoiceFeedbackSummary({
  perPhonemeAccuracy,
  exerciseType,
  sessionDuration,
  onClose,
}: VoiceFeedbackSummaryProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const totalCorrect = Object.values(perPhonemeAccuracy).reduce(
    (sum, { correct }) => sum + correct,
    0
  );
  const totalTrials = Object.values(perPhonemeAccuracy).reduce(
    (sum, { total }) => sum + total,
    0
  );
  const overallAccuracy = totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0;

  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true);
      const result = await generateVoiceFeedback({
        exerciseType,
        perPhoneme: perPhonemeAccuracy,
        sessionAccuracy: overallAccuracy,
        sessionDuration,
      });
      setFeedback(result || null);
      setIsLoading(false);
    };

    fetchFeedback();
  }, [perPhonemeAccuracy, exerciseType, overallAccuracy, sessionDuration]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
          className="w-full md:w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-xl p-6 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Session Summary</h2>
          </div>

          <div className="mb-6">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 mb-4">
              <div className="text-3xl font-bold text-teal-700 mb-1">{overallAccuracy}%</div>
              <div className="text-sm text-gray-600">
                {totalCorrect} out of {totalTrials} correct
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Phoneme Accuracy</h3>
            <div className="space-y-3">
              {Object.entries(perPhonemeAccuracy)
                .sort((a, b) => {
                  const aAcc = a[1].correct / a[1].total;
                  const bAcc = b[1].correct / b[1].total;
                  return bAcc - aAcc;
                })
                .map(([phoneme, { correct, total }]) => {
                  const accuracy = Math.round((correct / total) * 100);
                  let color = 'bg-red-200';
                  if (accuracy >= 80) {
                    color = 'bg-green-200';
                  } else if (accuracy >= 50) {
                    color = 'bg-amber-200';
                  }

                  return (
                    <div key={phoneme} className="flex items-center gap-3">
                      <div className="w-12 text-sm font-semibold text-gray-700">/{phoneme}/</div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className={`h-2 rounded-full ${color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${accuracy}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 w-12 text-right">
                        {correct}/{total}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
              <span className="ml-2 text-sm text-gray-600">Generating feedback...</span>
            </div>
          ) : feedback ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>
            </div>
          ) : null}

          <Button
            onClick={onClose}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            Done
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
