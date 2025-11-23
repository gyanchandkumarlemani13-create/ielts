import { TestResult, AppMode, HistoryItem } from '../types';

const STORAGE_KEY = 'ielts_testpro_history';

export const getHistory = (): HistoryItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveHistoryItem = (mode: AppMode, result: TestResult): HistoryItem[] => {
  try {
    const history = getHistory();
    
    // Create a safe copy of the result. 
    // Note: We cannot persist blob URLs (recordingUrl) in localStorage as they expire.
    // We strip it here to prevent dead links.
    const { recordingUrl, ...safeResult } = result;
    
    const newItem: HistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      date: Date.now(),
      mode,
      score: result.overallBand,
      result: { ...safeResult, date: Date.now() }
    };

    // Keep only last 50 items to prevent QuotaExceededError
    const updated = [newItem, ...history].slice(0, 50);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save history", e);
    return getHistory();
  }
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};