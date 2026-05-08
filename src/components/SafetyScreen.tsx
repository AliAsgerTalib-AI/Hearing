import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ChevronRight, XCircle } from 'lucide-react';
import { Card, Button } from './ui/basic';

interface SafetyScreenProps {
  onAccept: () => void;
  onCancel: () => void;
}

export const SafetyScreen = ({ onAccept, onCancel }: SafetyScreenProps) => {
  const contraindications = [
    "Sudden hearing loss in the last 90 days",
    "Ear pain, active discharge, or inflammation",
    "Severe dizziness or vertigo",
    "Single-sided hearing loss (unilateral)",
    "Pulsatile tinnitus (hearing your heartbeat)"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-amber-50 rounded-full mx-auto flex items-center justify-center text-amber-600">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-serif">Clinical Safety Check</h2>
        <p className="text-accent-sage text-sm">Please review the following contraindications before proceeding.</p>
      </div>

      <Card className="bg-amber-50/50 border-amber-100">
        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-4">You should NOT take this test if:</h3>
        <ul className="space-y-3">
          {contraindications.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-amber-900 leading-tight">
              <XCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <div className="bg-slate-50 p-4 rounded-2xl text-[11px] text-slate-400 leading-relaxed text-center">
        <strong>Medical Disclaimer:</strong> Longevity Hearing is a screening tool, not a diagnostic medical device. It does not replace a professional evaluation by an audiologist or ENT.
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={onAccept} className="w-full">
          None apply, continue test
        </Button>
        <Button onClick={onCancel} variant="ghost" className="w-full">
          I apply, go back
        </Button>
      </div>
    </motion.div>
  );
};
