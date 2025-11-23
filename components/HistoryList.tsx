import React from 'react';
import { HistoryItem, AppMode } from '../types';
import { Calendar, BarChart3, Edit3, Mic, ArrowRight, Clock, Trash2 } from 'lucide-react';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear }) => {
  const getIcon = (mode: AppMode) => {
    switch (mode) {
      case AppMode.WRITING_TASK_1: return <BarChart3 size={20} className="text-blue-500" />;
      case AppMode.WRITING_TASK_2: return <Edit3 size={20} className="text-indigo-500" />;
      case AppMode.SPEAKING: return <Mic size={20} className="text-rose-500" />;
      default: return <Clock size={20} className="text-slate-500" />;
    }
  };

  const getTitle = (mode: AppMode) => {
    switch (mode) {
      case AppMode.WRITING_TASK_1: return "Writing Task 1";
      case AppMode.WRITING_TASK_2: return "Writing Task 2";
      case AppMode.SPEAKING: return "Speaking Test";
      case AppMode.FEEDBACK: return "Text Analysis";
      default: return "Practice Session";
    }
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Clock size={40} className="text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No History Yet</h3>
        <p className="text-slate-500 max-w-sm text-center">
          Complete a writing or speaking test to see your performance history and progress here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-3xl font-bold text-slate-800">Exam History</h2>
           <p className="text-slate-500 mt-1">Track your progress and review past feedback.</p>
        </div>
        <button 
          onClick={onClear}
          className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
          Clear History
        </button>
      </div>

      <div className="grid gap-4">
        {history.map((item, index) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className="group bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 flex-shrink-0">
                  <span className={`text-xl font-bold ${item.score >= 7 ? 'text-emerald-600' : item.score >= 6 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {item.score}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Band</span>
               </div>
               
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   {getIcon(item.mode)}
                   <h3 className="font-bold text-slate-800">{getTitle(item.mode)}</h3>
                 </div>
                 <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(item.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>
               </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                View Feedback
              </span>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-400">
                <ArrowRight size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;