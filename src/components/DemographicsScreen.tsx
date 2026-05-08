import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { User, Users, Calendar, AlertCircle } from 'lucide-react';
import { Card, Button } from './ui/basic';

const MIN_AGE = 0;
const MAX_AGE = 120;

interface DemographicsData {
  age: number;
  sex: 'male' | 'female' | 'other';
}

interface DemographicsScreenProps {
  onComplete: (data: DemographicsData) => void;
}

const DemographicsScreenComponent = ({ onComplete }: DemographicsScreenProps) => {
  const [age, setAge] = useState<string>('30');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('female');

  const ageValidation = useMemo(() => {
    if (!age) return { valid: false, error: 'Age is required' };
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) return { valid: false, error: 'Age must be a number' };
    if (ageNum < MIN_AGE) return { valid: false, error: `Age must be at least ${MIN_AGE}` };
    if (ageNum > MAX_AGE) return { valid: false, error: `Age cannot exceed ${MAX_AGE}` };
    return { valid: true, error: null };
  }, [age]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-blue-50 rounded-full mx-auto flex items-center justify-center text-blue-600">
          <User size={32} />
        </div>
        <h2 className="text-2xl font-serif">Clinical Profile</h2>
        <p className="text-accent-sage text-sm">Age and biological sex significantly influence auditory baseline expectations.</p>
      </div>

      <Card className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="age-input" className="text-xs font-bold uppercase tracking-widest text-accent-sage flex items-center gap-2">
            <Calendar size={14} /> Biological Age
          </label>
          <input
            id="age-input"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={MIN_AGE}
            max={MAX_AGE}
            className={`w-full h-14 bg-slate-50 rounded-2xl px-6 text-xl font-serif focus:outline-none focus:ring-2 transition-colors ${
              ageValidation.valid
                ? 'focus:ring-accent-teal/20'
                : 'focus:ring-red-200 border-2 border-red-200'
            }`}
            placeholder="Years"
            aria-describedby={!ageValidation.valid ? "age-error" : undefined}
          />
          {!ageValidation.valid && (
            <div id="age-error" className="flex items-center gap-2 text-red-600 text-xs font-medium" role="alert">
              <AlertCircle size={14} />
              {ageValidation.error}
            </div>
          )}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold uppercase tracking-widest text-accent-sage flex items-center gap-2">
            <Users size={14} /> Biological Sex
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {(['male', 'female', 'other'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSex(s)}
                aria-label={`Select ${s}`}
                aria-pressed={sex === s}
                className={`h-12 rounded-xl border-2 transition-all capitalize text-sm font-medium ${
                  sex === s
                    ? 'border-accent-teal bg-teal-50 text-accent-teal'
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      </Card>

      <div className="flex flex-col gap-3">
        <Button
          disabled={!ageValidation.valid}
          onClick={() => onComplete({ age: parseInt(age, 10), sex })}
          className="w-full"
        >
          Continue calibration
        </Button>
      </div>
    </motion.div>
  );
};

export const DemographicsScreen = React.memo(DemographicsScreenComponent);
