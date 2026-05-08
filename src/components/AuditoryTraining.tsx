import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Star, BookOpen, Headphones, Zap, Sparkles, Brain, Loader2 } from 'lucide-react';
import { Card, Button } from './ui/basic';
import { generateAuditoryPlan, AuditoryPlan, TestResult } from '../services/geminiService';

// Mocking some baseline results for Sarah to show AI personalization
const MOCK_RESULTS: TestResult[] = [
  { side: 'both', freq: 250, db: 15 },
  { side: 'both', freq: 500, db: 20 },
  { side: 'both', freq: 1000, db: 25 },
  { side: 'both', freq: 2000, db: 45 },
  { side: 'both', freq: 4000, db: 60 },
  { side: 'both', freq: 8000, db: 70 }
];

const EXERCISES = [
  {
    id: 1,
    title: "Vowel Discrimination",
    duration: "5 min",
    intensity: "Low",
    icon: <BookOpen className="text-blue-500" />,
    description: "Identify subtle differences between vowel sounds to improve speech clarity.",
    unlocked: true
  },
  {
    id: 2,
    title: "Consonant Contrast",
    duration: "8 min",
    intensity: "Medium",
    icon: <Star className="text-amber-500" />,
    description: "Distinguish between sharp consonants like 'p', 'b', and 't' in noisy backgrounds.",
    unlocked: true
  },
  {
    id: 3,
    title: "High Frequency Pulse",
    duration: "3 min",
    intensity: "High",
    icon: <Zap className="text-purple-500" />,
    description: "Exercise your auditory nerve with targeted high-frequency stimulations.",
    unlocked: true
  },
  {
    id: 4,
    title: "Stereo Localization",
    duration: "10 min",
    intensity: "Medium",
    icon: <Headphones className="text-emerald-500" />,
    description: "Train your brain to pinpoint sound direction in a virtual 3D space.",
    unlocked: false
  }
];

export const AuditoryTraining = () => {
  const [aiPlan, setAiPlan] = useState<AuditoryPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getAiRegimen = async () => {
    setIsLoading(true);
    const plan = await generateAuditoryPlan(MOCK_RESULTS);
    setAiPlan(plan);
    setIsLoading(false);
  };

  return (
    <div className="space-y-8 p-6 pb-24">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif">Daily Exercises</h1>
        <p className="text-accent-sage italic font-serif">Neuroplasticity requires consistent stimulation.</p>
      </div>

      {/* AI Synapse Trainer */}
      <Card className="bg-primary text-white border-none p-6 space-y-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-teal/20 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent-teal">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Auditory Synapse AI</h3>
            <p className="text-[10px] uppercase tracking-widest text-accent-sage font-bold">Personalized Neuro-regimen</p>
          </div>
        </div>

        {!aiPlan ? (
          <div className="space-y-4 relative z-10">
            <p className="text-sm text-slate-300 leading-relaxed">
              Analyze your last clinical assessment to generate a custom training path targeting your specific hearing profile.
            </p>
            <Button 
              onClick={getAiRegimen} 
              disabled={isLoading}
              className="w-full h-12 bg-white text-primary hover:bg-slate-100 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
              {isLoading ? 'Processing Neural Patterns...' : 'Generate AI Regimen'}
            </Button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 relative z-10"
          >
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-accent-teal mb-1 block">AI Insight</span>
              <p className="text-xs italic text-slate-300">"{aiPlan.insight}"</p>
            </div>
            
            <div className="space-y-3">
               {aiPlan.exercises.slice(0, 2).map((ex, i) => (
                 <div key={i} className="flex gap-3 items-start">
                   <div className="p-1 px-2 rounded bg-accent-teal/20 text-[10px] font-bold h-fit mt-0.5">0{i+1}</div>
                   <div>
                     <h4 className="text-sm font-medium">{ex.title}</h4>
                     <p className="text-[11px] text-slate-400">{ex.durationMinutes}m • {ex.description}</p>
                   </div>
                 </div>
               ))}
            </div>

            <Button onClick={() => setAiPlan(null)} variant="ghost" className="w-full text-[10px] uppercase tracking-widest text-slate-400 hover:text-white">
              Reset AI Plan
            </Button>
          </motion.div>
        )}
      </Card>

      <div className="grid gap-6">
        {EXERCISES.map((ex, i) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="flex flex-col gap-4 p-5 hover:border-slate-300 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
                    {ex.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{ex.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-accent-sage mt-1">
                      <span className="flex items-center gap-1"><BookOpen size={12} /> {ex.duration}</span>
                      <span className="flex items-center gap-1 lowercase">Level: {ex.intensity}</span>
                    </div>
                  </div>
                </div>
                {!ex.unlocked && <div className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Locked</div>}
              </div>
              
              <p className="text-sm text-slate-500 leading-relaxed font-sans">
                {ex.description}
              </p>

              <div className="flex justify-end pt-2">
                <Button 
                  variant={ex.unlocked ? 'primary' : 'secondary'} 
                  disabled={!ex.unlocked}
                  className="h-10 px-6 text-sm"
                >
                  {ex.unlocked ? 'Start Session' : 'Level 5 Required'}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
