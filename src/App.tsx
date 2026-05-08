import React, { useState } from 'react';
import { Home, Activity, Headphones, Mic2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HomeView } from './components/HomeView';
import { HearingTest } from './components/HearingTest';
import { AuditoryTraining } from './components/AuditoryTraining';
import { EnvironmentalAnalyzer } from './components/EnvironmentalAnalyzer';
import { StorageProvider } from './contexts/StorageContext';
import { cn } from './lib/utils';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'home' | 'test' | 'training' | 'live'>('home');
  const [isTestMode, setIsTestMode] = useState(false);

  // If in test mode, we show the full screen test
  if (isTestMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto">
          <HearingTest />
          <button 
            onClick={() => setIsTestMode(false)}
            className="absolute top-6 left-6 w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 shadow-sm"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-[100dvh] bg-background font-sans selection:bg-accent-teal/10 flex flex-col items-center">
      <div className="w-full max-w-md h-full relative overflow-hidden flex flex-col bg-white shadow-2xl">
        
        {/* Top Navigation / Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-3 pt-4">
          <div className="flex justify-between items-center bg-slate-100/50 rounded-2xl p-1">
            <NavButton
              active={activeTab === 'home'}
              onClick={() => setActiveTab('home')}
              icon={<Home size={22} />}
              label="Home"
              ariaLabel="Navigate to home screen"
            />
            <NavButton
              active={activeTab === 'training'}
              onClick={() => setActiveTab('training')}
              icon={<Headphones size={22} />}
              label="Train"
              ariaLabel="Navigate to auditory training exercises"
            />
            <NavButton
              active={activeTab === 'live'}
              onClick={() => setActiveTab('live')}
              icon={<Mic2 size={22} />}
              label="Live"
              ariaLabel="Navigate to real-time acoustic insights"
            />
            <NavButton
              active={activeTab === 'test'}
              onClick={() => setActiveTab('test')}
              icon={<Activity size={22} />}
              label="Check"
              ariaLabel="Navigate to hearing assessment"
            />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto overscroll-none pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
              >
                <HomeView onStartTest={() => setIsTestMode(true)} />
              </motion.div>
            )}
            
            {activeTab === 'training' && (
              <motion.div
                key="training"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <AuditoryTraining />
              </motion.div>
            )}

            {activeTab === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 h-full"
              >
                <EnvironmentalAnalyzer />
              </motion.div>
            )}

            {activeTab === 'test' && (
              <motion.div
                key="test"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 space-y-6"
              >
                <h1 className="text-3xl font-serif">Assessment</h1>
                <p className="text-accent-sage">Start a new hearing check-up to update your clinical profile.</p>
                <button 
                   onClick={() => setIsTestMode(true)}
                   className="w-full bg-primary text-white h-20 rounded-3xl font-medium text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                >
                  <Activity /> Start Audiometry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legal Disclaimer Footer */}
          <footer className="px-6 py-8 border-t border-slate-50 bg-slate-50/30 font-sans">
            <div className="space-y-3">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Medical Disclaimer</h5>
              <p className="text-[10px] leading-relaxed text-slate-400 italic">
                This application is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. 
                Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. 
                Do not disregard professional medical advice or delay in seeking it because of results from this app.
              </p>
              <div className="pt-2 flex justify-between items-center text-[10px] text-slate-300 font-medium">
                <span>© 2024 Acoustic Home Labs</span>
                <span>v1.0.4-beta</span>
              </div>
            </div>
          </footer>
        </main>

        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[50%] h-64 bg-accent-teal/5 rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[40%] h-48 bg-accent-gold/5 rounded-tr-full pointer-events-none" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StorageProvider>
      <AppContent />
    </StorageProvider>
  );
}

function NavButton({ active, onClick, icon, label, ariaLabel }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, ariaLabel: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex flex-col items-center justify-center flex-1 h-12 transition-all relative overflow-hidden",
        active ? "text-primary" : "text-accent-sage hover:text-slate-500"
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-bg"
          className="absolute inset-1 bg-white rounded-2xl shadow-sm -z-10"
        />
      )}
      <div className={cn("transition-transform flex items-center gap-2", active && "scale-105")}>
        {icon}
        {active && (
          <motion.span 
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {label}
          </motion.span>
        )}
      </div>
    </button>
  );
}
