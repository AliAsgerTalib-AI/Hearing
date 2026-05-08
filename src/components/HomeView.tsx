import React from 'react';
import { motion } from 'motion/react';
import { Activity, Mic2, History, Trash2 } from 'lucide-react';
import { Card, Button } from './ui/basic';
import { useStorage } from '../contexts/StorageContext';
import { ProgressionPanel } from './ProgressionPanel';

export const HomeView = ({ onStartTest }: { onStartTest: () => void }) => {
  const { history, clearAll } = useStorage();

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all test history? This cannot be undone.")) {
      clearAll();
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-sage">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-serif">Acoustic Home</h1>
        </div>
      </div>

      {/* Quick Action */}
      <div className="space-y-4">
        <div className="space-y-3">
          <Card className="p-0 overflow-hidden flex">
            <div className="flex-1 p-6 space-y-4">
              <h3 className="font-semibold text-lg leading-tight">Bi-weekly Hearing Accuracy</h3>
              <p className="text-xs text-accent-sage">Takes about 4 minutes. Needs a quiet room.</p>
              <Button onClick={onStartTest} className="h-10 px-6 text-sm">Start Test</Button>
            </div>
          </Card>

          <Card className="p-6 bg-slate-50 border-dashed border-slate-200">
            <div className="flex items-start gap-4">
               <div className="p-3 bg-white rounded-2xl shadow-sm text-teal-600">
                 <Mic2 size={24} />
               </div>
               <div className="space-y-1">
                 <h4 className="font-bold">Acoustic Insights</h4>
                 <p className="text-xs text-accent-sage">Visualize how the world sounds to you in real-time. Access via the Live tab.</p>
               </div>
            </div>
          </Card>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-xl flex items-center gap-2">
            <History size={20} className="text-accent-teal" /> Recent Activity
          </h4>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} /> Clear All
            </button>
          )}
        </div>

        <ProgressionPanel history={history} />
      </div>
    </div>
  );
};
