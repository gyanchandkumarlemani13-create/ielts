import React from 'react';
import { TestResult, AppMode } from '../types';
import ReactMarkdown from 'react-markdown';
import { Star, AlertTriangle, BookOpen, CheckCircle2, Mic, Volume2, Award, ArrowRight } from 'lucide-react';

interface FeedbackDisplayProps {
  result: TestResult;
  onRetry: () => void;
  mode: AppMode;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ result, onRetry, mode }) => {
  const getBandColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 6) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  const playPronunciation = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="animate-fade-in pb-8">
      {/* Header Summary */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
           {/* Score Circle */}
           <div className="relative flex-shrink-0">
               <svg className="w-48 h-48 transform -rotate-90">
                   <circle cx="96" cy="96" r="88" className="stroke-slate-100" strokeWidth="12" fill="none" />
                   <circle 
                     cx="96" cy="96" r="88" 
                     className="stroke-blue-600" 
                     strokeWidth="12" 
                     fill="none" 
                     strokeDasharray={2 * Math.PI * 88}
                     strokeDashoffset={2 * Math.PI * 88 * (1 - result.overallBand / 9)}
                     strokeLinecap="round"
                   />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                   <span className="text-5xl font-extrabold text-slate-800 tracking-tight">{result.overallBand}</span>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Band Score</span>
               </div>
           </div>

           <div className="flex-1 text-center md:text-left">
               <h2 className="text-3xl font-bold text-slate-800 mb-2">Test Completed Successfully</h2>
               <p className="text-slate-500 mb-6 max-w-xl">
                 Here is your detailed performance breakdown based on official IELTS assessment criteria. 
                 Review the feedback to identify your strengths and areas for improvement.
               </p>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {result.criteriaScores.map((c, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate" title={c.name}>{c.name}</span>
                      <span className={`text-xl font-bold ${getBandColor(c.score).split(' ')[0]}`}>{c.score}</span>
                    </div>
                  ))}
               </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Detailed Analysis */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <BookOpen size={20} />
              </div>
              Examiner Analysis
            </h3>
            <div className="prose prose-slate prose-sm md:prose-base max-w-none text-slate-600">
              <ReactMarkdown>{result.feedbackText}</ReactMarkdown>
            </div>
          </div>
          
           {/* Pronunciation (Speaking Only) */}
           {result.pronunciationTips && result.pronunciationTips.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Mic size={20} />
                </div>
                Pronunciation Workshop
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.pronunciationTips.map((tip, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => playPronunciation(tip.word)}
                    className="group bg-slate-50 hover:bg-white border border-slate-100 hover:border-purple-200 hover:shadow-md p-4 rounded-xl flex items-start gap-4 transition-all text-left"
                  >
                    <div className="mt-1 w-8 h-8 flex-shrink-0 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-sm border border-slate-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Volume2 size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">{tip.word}</span>
                        <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{tip.ipa}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1 line-clamp-1 text-red-500">Error: {tip.error}</p>
                      <p className="text-xs text-slate-600 leading-snug">
                        <span className="font-semibold text-purple-700">Tip:</span> {tip.tip}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
           )}

          {/* Model Answer */}
          {result.modelAnswer && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <Award size={20} />
                </div>
                Band 9.0 Model Response
              </h3>
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50 text-slate-700 leading-relaxed text-sm whitespace-pre-line font-medium">
                {result.modelAnswer}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           {/* Recording Player */}
          {result.recordingUrl && (
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
                Session Recording
              </h3>
              <audio controls src={result.recordingUrl} className="w-full h-8 invert opacity-90" />
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2.5">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              Critical Corrections
            </h3>
            <div className="space-y-4">
              {result.corrections.length === 0 ? (
                <div className="text-center py-12 bg-green-50 rounded-xl border border-green-100 border-dashed">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500" />
                  <p className="text-green-800 font-bold text-sm">Excellent!</p>
                  <p className="text-green-600 text-xs mt-1">No significant errors found.</p>
                </div>
              ) : (
                result.corrections.map((corr, idx) => (
                  <div key={idx} className="bg-red-50/50 p-4 rounded-xl border border-red-100 transition-colors hover:bg-red-50">
                    <div className="mb-2 text-red-900/60 line-through decoration-red-400/50 text-sm">
                      {corr.original}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                       <ArrowRight size={14} className="text-green-600" />
                       <span className="text-green-700 font-bold text-sm bg-green-100/50 px-2 py-0.5 rounded">{corr.correction}</span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed pl-6 border-l-2 border-red-200">
                      {corr.explanation}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-12 pb-8">
        <button 
          onClick={onRetry}
          className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-slate-900 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 hover:bg-slate-800 hover:scale-105 shadow-xl"
        >
          Start New Test
          <ArrowRight className="ml-2 -mr-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default FeedbackDisplay;