import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ChevronRight, XCircle, CheckCircle } from 'lucide-react';
import { Card, Button } from './ui/basic';
import { useContraindicationScreening, canProceedWithTesting, getSeverityMessage } from '../hooks/useContraindicationScreening';
import { ScreeningResponse } from '../types/contraindications';
import { ContraindicationReport } from './ContraindicationReport';

interface SafetyScreenProps {
  onAccept: (responses: ScreeningResponse) => void;
  onCancel: () => void;
}

const SafetyScreenComponent = ({ onAccept, onCancel }: SafetyScreenProps) => {
  const { responses, result, recordResponses, evaluateContraindications } = useContraindicationScreening();
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [currentStep, setCurrentStep] = useState<'questions' | 'review'>('questions');

  // Core screening questions (absolute contraindications first)
  const absoluteQuestions = [
    {
      key: 'suddenHearingLoss' as const,
      question: 'Have you noticed a sudden drop in hearing within the past 3 weeks?',
      detail: 'This is a medical emergency requiring urgent ENT evaluation.'
    },
    {
      key: 'earDrainageActive' as const,
      question: 'Do you have any drainage or fluid from your ear(s) right now?',
      detail: 'Active infection requires medical treatment before testing.'
    },
    {
      key: 'earPain' as const,
      question: 'Are you experiencing ear pain?',
      detail: 'Pain suggests inflammation or infection that needs evaluation.'
    },
    {
      key: 'dizzinessVertigo' as const,
      question: 'Are you experiencing severe dizziness or spinning sensation?',
      detail: 'This could indicate a balance disorder.'
    },
    {
      key: 'recentEarSurgery' as const,
      question: 'Have you had any ear surgery in the past 2 months?',
      detail: 'Surgical sites need time to heal. Do you have written surgeon clearance?'
    },
    {
      key: 'eardArmPerforation' as const,
      question: 'Has a doctor told you that you have a hole in your eardrum?',
      detail: 'A perforated eardrum requires special precautions.'
    },
    {
      key: 'retrocochlearDiagnosis' as const,
      question: 'Have you been diagnosed with an acoustic neuroma or brain tumor affecting your hearing?',
      detail: 'This requires specialist clearance.'
    }
  ];

  const relativeQuestions = [
    {
      key: 'meniersDiagnosis' as const,
      question: 'Have you been diagnosed with Meniere\'s disease?',
      detail: 'Safe to test if symptoms are stable.'
    },
    {
      key: 'ototoxicMeds' as const,
      question: 'Are you taking ototoxic medications (antibiotics, chemotherapy, high-dose NSAIDs)?',
      detail: 'Baseline testing before medication is recommended.'
    },
    {
      key: 'recentHeadTrauma' as const,
      question: 'Have you had a head injury or concussion in the past 8 weeks?',
      detail: 'Medical clearance is recommended before testing.'
    }
  ];

  const handleResponse = (key: keyof ScreeningResponse, value: any) => {
    const newResponses = { ...responses, [key]: value };
    recordResponses(newResponses);
  };

  const canProceed = result?.canProceed ?? false;
  const hasIssues = (result?.identified.length ?? 0) > 0 || (result?.requiresApproval.length ?? 0) > 0;

  if (showDetailedReport) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <ContraindicationReport showRelative={true} expandAll={false} />
        <div className="flex gap-3">
          <Button onClick={() => setShowDetailedReport(false)} variant="ghost" className="flex-1">
            Back to Screening
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-amber-50 rounded-full mx-auto flex items-center justify-center text-amber-600">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-serif">Safety Screening</h2>
        <p className="text-accent-sage text-sm">A few quick questions to ensure safe testing</p>
      </div>

      {/* Status Message */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex gap-3 ${
            canProceed
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {canProceed ? (
            <CheckCircle size={20} className="shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{getSeverityMessage(result)}</p>
        </motion.div>
      )}

      {/* Screening Questions */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Critical Questions
          </h3>
          <div className="space-y-2">
            {absoluteQuestions.map(q => (
              <div key={q.key} className="space-y-1">
                <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name={q.key}
                    value="yes"
                    checked={responses[q.key] === true}
                    onChange={() => handleResponse(q.key, true)}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-700">{q.question}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{q.detail}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 px-3 pb-2">
                  <input
                    type="radio"
                    name={q.key}
                    value="no"
                    checked={responses[q.key] === false}
                    onChange={() => handleResponse(q.key, false)}
                    className="mt-1 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">No</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Relative Questions (if no absolute contraindications) */}
        {!hasIssues && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              Additional Conditions
            </h3>
            <div className="space-y-2">
              {relativeQuestions.map(q => (
                <div key={q.key} className="space-y-1">
                  <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name={q.key}
                      value="yes"
                      checked={responses[q.key] === true}
                      onChange={() => handleResponse(q.key, true)}
                      className="mt-1 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-700">{q.question}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{q.detail}</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 px-3 pb-2">
                    <input
                      type="radio"
                      name={q.key}
                      value="no"
                      checked={responses[q.key] === false}
                      onChange={() => handleResponse(q.key, false)}
                      className="mt-1 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600">No</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Medical Disclaimer */}
      <div className="bg-slate-50 p-4 rounded-2xl text-[11px] text-slate-400 leading-relaxed text-center">
        <strong>Medical Disclaimer:</strong> Longevity Hearing is a screening tool, not a diagnostic medical device.
        It does not replace evaluation by an audiologist or ENT. See detailed contraindication information below.
      </div>

      {/* View Full Report Button */}
      <button
        onClick={() => setShowDetailedReport(true)}
        className="w-full text-[11px] font-semibold text-accent-teal uppercase tracking-wider hover:text-accent-teal/80 transition"
      >
        View detailed contraindication information →
      </button>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
        <Button
          onClick={() => {
            if (canProceed) {
              onAccept(responses);
            }
          }}
          disabled={!canProceed}
          className="w-full"
        >
          {canProceed ? 'Continue to Hearing Test' : 'Cannot proceed - address contraindications'}
        </Button>
        <Button onClick={onCancel} variant="ghost" className="w-full">
          Cancel & Exit
        </Button>
      </div>

      {/* Modifications if present */}
      {result?.modifications && result.modifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2"
        >
          <p className="text-sm font-semibold text-amber-900">Testing Precautions:</p>
          <ul className="space-y-1">
            {result.modifications.map((mod, i) => (
              <li key={i} className="text-xs text-amber-800">• {mod}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
};

export const SafetyScreen = React.memo(SafetyScreenComponent);
