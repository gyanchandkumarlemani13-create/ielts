import React, { useState, Suspense, lazy, useEffect } from 'react';
import Layout from './components/Layout';
import { AppMode, TestResult, HistoryItem } from './types';
import { saveHistoryItem, getHistory, clearHistory } from './services/storage';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components for performance optimization
const ModeSelection = lazy(() => import('./components/ModeSelection'));
const WritingTest = lazy(() => import('./components/WritingTest'));
const SpeakingTest = lazy(() => import('./components/SpeakingTest'));
const FeedbackDisplay = lazy(() => import('./components/FeedbackDisplay'));
const PracticeMode = lazy(() => import('./components/PracticeMode'));
const FeedbackInput = lazy(() => import('./components/FeedbackInput'));
const HistoryList = lazy(() => import('./components/HistoryList'));

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh]">
    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
    <p className="text-slate-500 font-medium">Loading content...</p>
  </div>
);

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.LANDING);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // Load history on mount
    setHistory(getHistory());
  }, []);

  const handleModeSelect = (mode: AppMode) => {
    setCurrentMode(mode);
    setTestResult(null);
  };

  const handleTestComplete = (result: TestResult) => {
    // Save to history automatically
    if (currentMode !== AppMode.HISTORY) {
       const updatedHistory = saveHistoryItem(currentMode, result);
       setHistory(updatedHistory);
    }
    setTestResult(result);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setTestResult(item.result);
    // When viewing history, we can set mode to the original mode of the item
    // or keep it in HISTORY context. Let's keep context for navigation.
    // However, FeedbackDisplay needs to know the mode to render correct color schemes.
    // We can pass item.mode to it via props if needed, but for now `currentMode` being HISTORY is fine
    // as we just display results.
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire exam history? This cannot be undone.")) {
      clearHistory();
      setHistory([]);
    }
  };

  const handleGoHome = () => {
    setCurrentMode(AppMode.LANDING);
    setTestResult(null);
  };

  const handleShowHistory = () => {
    setCurrentMode(AppMode.HISTORY);
    setTestResult(null);
  };

  const renderContent = () => {
    if (testResult) {
      return (
        <FeedbackDisplay 
          result={testResult} 
          onRetry={handleGoHome} 
          mode={currentMode === AppMode.HISTORY ? AppMode.LANDING : currentMode} // Pass neutral mode if history
        />
      );
    }

    switch (currentMode) {
      case AppMode.LANDING:
        return <ModeSelection onSelect={handleModeSelect} />;
      
      case AppMode.WRITING_TASK_1:
        return <WritingTest taskType="Task 1" onComplete={handleTestComplete} />;
      
      case AppMode.WRITING_TASK_2:
        return <WritingTest taskType="Task 2" onComplete={handleTestComplete} />;
      
      case AppMode.SPEAKING:
        return <SpeakingTest onComplete={handleTestComplete} />;
      
      case AppMode.PRACTICE:
        return <PracticeMode />;

      case AppMode.FEEDBACK:
        return <FeedbackInput onAnalyze={handleTestComplete} />;

      case AppMode.HISTORY:
        return (
          <HistoryList 
            history={history} 
            onSelect={handleHistorySelect} 
            onClear={handleClearHistory} 
          />
        );
        
      default:
        return <ModeSelection onSelect={handleModeSelect} />;
    }
  };

  return (
    <Layout 
      currentMode={currentMode} 
      onGoHome={handleGoHome}
      onShowHistory={handleShowHistory}
    >
      <Suspense fallback={<LoadingFallback />}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
};

export default App;