import React, { createContext, useContext, useState, useEffect } from 'react';
import { GamificationProgress, ExerciseSession } from '../types/index';
import { GamificationEngine } from '../lib/GamificationEngine';

const GAMIFICATION_STORAGE_KEY = 'hearingGamificationData';

interface GamificationContextType {
  progress: GamificationProgress | null;
  recordSession: (
    exerciseId: number,
    exerciseTitle: string,
    duration: number,
    accuracy: number,
    level: number
  ) => void;
  getSessions: () => ExerciseSession[];
  getMotivationMessage: () => string;
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined
);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [engine, setEngine] = useState<GamificationEngine | null>(null);
  const [progress, setProgress] = useState<GamificationProgress | null>(null);

  // Initialize gamification engine from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : { sessions: [] };

      if (!Array.isArray(data.sessions)) {
        data.sessions = [];
      }

      const newEngine = new GamificationEngine(data.sessions);
      setEngine(newEngine);
      setProgress(newEngine.getProgress());
    } catch (error) {
      console.error('Failed to load gamification data:', error);
      const newEngine = new GamificationEngine();
      setEngine(newEngine);
      setProgress(newEngine.getProgress());
    }
  }, []);

  // Save to storage whenever progress changes
  useEffect(() => {
    if (engine) {
      try {
        const exportedData = engine.export();
        localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(exportedData));
      } catch (error) {
        console.error('Failed to save gamification data:', error);
      }
    }
  }, [engine]);

  const recordSession = (
    exerciseId: number,
    exerciseTitle: string,
    duration: number,
    accuracy: number,
    level: number
  ) => {
    if (engine) {
      const newProgress = engine.recordSession(
        exerciseId,
        exerciseTitle,
        duration,
        accuracy,
        level
      );
      setProgress(newProgress);
    }
  };

  const getSessions = (): ExerciseSession[] => {
    return engine?.getSessions() || [];
  };

  const getMotivationMessage = (): string => {
    return engine?.getMotivationMessage() || 'Ready to start training?';
  };

  return (
    <GamificationContext.Provider
      value={{
        progress,
        recordSession,
        getSessions,
        getMotivationMessage
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
};
