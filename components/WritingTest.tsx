import React, { useState, useEffect } from 'react';
import { generateWritingTask, evaluateWriting } from '../services/geminiService';
import { TestResult, WritingPrompt } from '../types';
import { Loader2, Timer, CheckCircle2, ChevronRight, PenLine, Maximize2 } from 'lucide-react';

interface WritingTestProps {
  taskType: 'Task 1' | 'Task 2';
  onComplete: (result: TestResult) => void;
}

const WritingTest: React.FC<WritingTestProps> = ({ taskType, onComplete }) => {
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(taskType === 'Task 1' ? 1200 : 2400);

  useEffect(() => {
    let mounted = true;
    generateWritingTask(taskType).then(p => {
      if (mounted) {
        setPrompt(p);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [taskType]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEssayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setEssay(text);
    setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);
  };

  const handleSubmit = async () => {
    if (!prompt) return;
    if (wordCount < 50) {
      alert("Your essay is too short. Please write more before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await evaluateWriting(prompt, essay);
      onComplete(result);
    } catch (e) {
      alert("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <PenLine className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-800">Generating Exam</h3>
          <p className="text-slate-500 mt-2">Preparing a unique {taskType} topic...</p>
        </div>
      </div>
    );
  }

  const minWords = taskType === 'Task 1' ? 150 : 250;
  const isTimeLow = timeLeft < 300;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      {/* Prompt Panel */}
      <div className="lg:w-5/12 h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider">
              {taskType}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Question Paper
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {prompt && (
            <div className="prose prose-slate prose-sm max-w-none">
              <h3 className="text-xl font-bold text-slate-800 mb-4 leading-snug">{prompt.title}</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6 text-slate-700 italic">
                {prompt.instructions}
              </div>
              
              {prompt.imageUrl ? (
                <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img 
                    src={prompt.imageUrl} 
                    alt="Task Visualization" 
                    className="w-full h-auto object-contain bg-white"
                  />
                </div>
              ) : prompt.imageDescription && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm mb-6">
                  <strong className="block mb-1 text-blue-900">Data Description:</strong> 
                  {prompt.imageDescription}
                </div>
              )}

              <div className="flex items-start gap-3 text-slate-500 text-xs mt-8 pt-6 border-t border-slate-100">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-2"></div>
                <p>You should spend about {taskType === 'Task 1' ? '20' : '40'} minutes on this task.</p>
              </div>
              <div className="flex items-start gap-3 text-slate-500 text-xs mt-2">
                <div className="w-1 h-1 rounded-full bg-slate-400 mt-2"></div>
                <p>Write at least {minWords} words.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Answer Panel */}
      <div className="flex-1 h-full flex flex-col">
        {/* Toolbar */}
        <div className="bg-white rounded-t-2xl shadow-sm border border-slate-200 border-b-0 px-6 py-3 flex items-center justify-between z-10">
          <div className={`flex items-center gap-2 font-mono text-sm font-bold ${isTimeLow ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
            <Timer className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex items-center gap-4 text-sm">
             <div className={`transition-colors font-medium ${wordCount < minWords ? 'text-amber-500' : 'text-green-600'}`}>
               {wordCount} <span className="text-slate-400 text-xs font-normal">/ {minWords} words</span>
             </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-slate-100 p-4 lg:p-6 border-x border-slate-200 overflow-hidden relative">
           <textarea
            className="w-full h-full bg-white shadow-sm p-8 resize-none focus:outline-none focus:ring-1 focus:ring-blue-200 text-slate-800 leading-relaxed text-lg font-serif placeholder:text-slate-300 rounded-b-sm"
            placeholder="Type your essay here..."
            value={essay}
            onChange={handleEssayChange}
            spellCheck={false}
          />
        </div>
        
        {/* Footer Actions */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 border-t-0 p-4 flex justify-end">
           <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                Submit Response
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritingTest;