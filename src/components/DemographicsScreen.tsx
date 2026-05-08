import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Users, Calendar } from 'lucide-react';
import { Card, Button } from './ui/basic';

interface DemographicsData {
  age: number;
  sex: 'male' | 'female' | 'other';
}

interface DemographicsScreenProps {
  onComplete: (data: DemographicsData) => void;
}

export const DemographicsScreen = ({ onComplete }: DemographicsScreenProps) => {
  const [age, setAge] = useState<string>('30');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('female');

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
          <label className="text-xs font-bold uppercase tracking-widest text-accent-sage flex items-center gap-2">
            <Calendar size={14} /> Biological Age
          </label>
          <input 
            type="number" 
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full h-14 bg-slate-50 rounded-2xl px-6 text-xl font-serif focus:outline-none focus:ring-2 focus:ring-accent-teal/20"
            placeholder="Years"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-accent-sage flex items-center gap-2">
            <Users size={14} /> Biological Sex
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['male', 'female', 'other'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSex(s)}
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
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <Button 
          disabled={!age || parseInt(age) <= 0}
          onClick={() => onComplete({ age: parseInt(age), sex })} 
          className="w-full"
        >
          Continue calibration
        </Button>
      </div>
    </motion.div>
  );
};
