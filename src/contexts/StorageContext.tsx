import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HearingHistoryEntry, TestResult } from '../types/index';

interface StorageContextType {
  history: HearingHistoryEntry[];
  testResults: TestResult[];
  updateHistory: (newHistory: HearingHistoryEntry[]) => void;
  updateTestResults: (newResults: TestResult[]) => void;
  clearAll: () => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HearingHistoryEntry[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const historyRaw = localStorage.getItem('hearingTestHistory');
        if (historyRaw) {
          try {
            const parsed = JSON.parse(historyRaw);
            if (Array.isArray(parsed)) {
              setHistory(parsed);
            }
          } catch (e) {
            console.error('Failed to parse hearing test history:', e);
          }
        }

        const resultsRaw = localStorage.getItem('hearingTestResults');
        if (resultsRaw) {
          try {
            const parsed = JSON.parse(resultsRaw);
            if (Array.isArray(parsed) && parsed.every(item =>
              item && typeof item === 'object' && 'side' in item && 'freq' in item && 'db' in item
            )) {
              setTestResults(parsed);
            }
          } catch (e) {
            console.error('Failed to parse hearing test results:', e);
          }
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadFromStorage();
  }, []);

  const updateHistory = (newHistory: HearingHistoryEntry[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('hearingTestHistory', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save history to localStorage:', e);
    }
  };

  const updateTestResults = (newResults: TestResult[]) => {
    setTestResults(newResults);
    try {
      localStorage.setItem('hearingTestResults', JSON.stringify(newResults));
    } catch (e) {
      console.error('Failed to save test results to localStorage:', e);
    }
  };

  const clearAll = () => {
    setHistory([]);
    setTestResults([]);
    try {
      localStorage.removeItem('hearingTestHistory');
      localStorage.removeItem('hearingTestResults');
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  };

  return (
    <StorageContext.Provider value={{ history, testResults, updateHistory, updateTestResults, clearAll }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
