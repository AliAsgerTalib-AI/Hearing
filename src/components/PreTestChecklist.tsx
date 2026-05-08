/**
 * Pre-Test Safety Checklist
 * Shown immediately before hearing test begins
 * Verifies safe testing conditions and user readiness
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, Button } from './ui/basic';

interface PreTestChecklistProps {
  onConfirmed: () => void;
  onCancel: () => void;
  hasMeniersDiagnosis?: boolean;
  hasRecentSurgery?: boolean;
}

export const PreTestChecklist: React.FC<PreTestChecklistProps> = ({
  onConfirmed,
  onCancel,
  hasMeniersDiagnosis = false,
  hasRecentSurgery = false
}) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const baseChecks = [
    {
      id: 'safe-location',
      label: 'I am in a safe, comfortable location where I can sit safely',
      required: true
    },
    {
      id: 'no-dizziness',
      label: 'I am not currently experiencing dizziness, vertigo, or balance problems',
      required: true
    },
    {
      id: 'no-ear-pain',
      label: 'I do not have ear pain or new discharge from my ear(s)',
      required: true
    },
    {
      id: 'clean-earpiece',
      label: 'My earpiece/headphones are clean and comfortable',
      required: true
    },
    {
      id: 'can-stop',
      label: 'I understand I can stop at any time by closing this window',
      required: true
    }
  ];

  const conditionalChecks = [
    {
      id: 'menieres-stable',
      label: 'I have not had vertigo symptoms in the past 48 hours (Meniere\'s monitoring)',
      required: hasMeniersDiagnosis,
      condition: hasMeniersDiagnosis
    },
    {
      id: 'post-surgery-clearance',
      label: 'I have written clearance from my surgeon to do this test (Post-surgical)',
      required: hasRecentSurgery,
      condition: hasRecentSurgery
    }
  ];

  const allChecks = [...baseChecks, ...conditionalChecks.filter(c => c.condition)];
  const requiredUnchecked = allChecks.filter(
    c => c.required && !checkedItems.has(c.id)
  );

  const toggleCheck = (id: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCheckedItems(newSet);
  };

  const canProceed = requiredUnchecked.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-emerald-600">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-serif">Before We Start</h2>
        <p className="text-accent-sage text-sm">Please confirm these safety checks</p>
      </div>

      <Card className="bg-emerald-50 border-emerald-100 p-4 space-y-3">
        <p className="text-sm font-semibold text-emerald-900">Testing Environment Safety</p>
        <div className="space-y-2">
          {allChecks.map(check => (
            <label key={check.id} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-emerald-100/50 rounded">
              <input
                type="checkbox"
                checked={checkedItems.has(check.id)}
                onChange={() => toggleCheck(check.id)}
                className="mt-1 w-4 h-4 cursor-pointer"
                required={check.required}
              />
              <span className="text-sm text-emerald-900">{check.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Additional Safety Notes */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-blue-800 text-sm">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Important Notes:</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Keep earpieces at comfortable volume (don't turn up too loud)</li>
            <li>Stop immediately if you feel pain, dizziness, or discomfort</li>
            <li>The app will tell you when to play tones and when to respond</li>
            <li>It's okay to ask for breaks between frequency tests</li>
          </ul>
        </div>
      </div>

      {/* Conditional Warnings */}
      {hasMeniersDiagnosis && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Meniere's Disease Precaution:</p>
            <p className="text-xs mt-1">
              If any dizziness starts during testing, stop immediately and rest. You can resume later when symptoms resolve.
            </p>
          </div>
        </div>
      )}

      {hasRecentSurgery && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Post-Surgical Precaution:</p>
            <p className="text-xs mt-1">
              You're testing during the healing phase. Testing at moderate volumes to protect your surgical outcome.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
        <Button
          onClick={onConfirmed}
          disabled={!canProceed}
          className="w-full"
        >
          {canProceed ? '✓ Start Hearing Test' : `Please confirm all checks (${requiredUnchecked.length} remaining)`}
        </Button>
        <Button onClick={onCancel} variant="ghost" className="w-full">
          Not Ready Yet - Go Back
        </Button>
      </div>
    </motion.div>
  );
};
