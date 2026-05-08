import React from 'react';
import { motion } from 'motion/react';
import { Activity, Mic2, History, Trash2, ChevronRight, Calendar } from 'lucide-react';
import { Card, Button } from './ui/basic';
import { Progress } from './ui/progress';
import { useStorage } from '../contexts/StorageContext';

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

        {history.length === 0 ? (
          <div className="text-center py-12 px-6 bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed">
            <p className="text-xs text-slate-400 font-medium italic">No previous test data found. Complete your first assessment to see trends here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 3).map((entry) => (
              <Card key={entry.id} className="p-4 flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <Calendar size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-primary">{entry.date}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-tighter font-bold text-accent-sage">L: {entry.avgLeft}dB</span>
                      <span className="text-[10px] text-slate-200">•</span>
                      <span className="text-[10px] uppercase tracking-tighter font-bold text-accent-sage">R: {entry.avgRight}dB</span>
                    </div>
                  </div>
                </div>
                <div className="text-slate-300 transform group-hover:translate-x-1 transition-transform">
                  <ChevronRight size={16} />
                </div>
              </Card>
            ))}
            {history.length > 3 && (
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                + {history.length - 3} more sessions in local storage
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
