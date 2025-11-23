import React from 'react';
import { AppMode } from '../types';
import { PenTool, Mic, BookOpen, BarChart3, Edit3, ArrowRight } from 'lucide-react';

interface ModeSelectionProps {
  onSelect: (mode: AppMode) => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelect }) => {
  const modes = [
    {
      id: AppMode.WRITING_TASK_1,
      title: "Writing Task 1",
      description: "Analyze visual data. Describe charts, graphs, or maps with precision.",
      icon: BarChart3,
      color: "from-blue-500 to-cyan-400",
      bg: "bg-blue-50",
      border: "hover:border-blue-300",
      time: "20 mins"
    },
    {
      id: AppMode.WRITING_TASK_2,
      title: "Writing Task 2",
      description: "Construct a coherent argument or essay on a general topic.",
      icon: Edit3,
      color: "from-indigo-500 to-violet-500",
      bg: "bg-indigo-50",
      border: "hover:border-indigo-300",
      time: "40 mins"
    },
    {
      id: AppMode.SPEAKING,
      title: "Speaking Test",
      description: "Interactive 3-part interview simulation with a real-time AI examiner.",
      icon: Mic,
      color: "from-rose-500 to-pink-500",
      bg: "bg-rose-50",
      border: "hover:border-rose-300",
      time: "15 mins"
    },
    {
      id: AppMode.PRACTICE,
      title: "Practice Bank",
      description: "Generate unlimited custom questions to drill specific skills.",
      icon: BookOpen,
      color: "from-emerald-500 to-teal-400",
      bg: "bg-emerald-50",
      border: "hover:border-emerald-300",
      time: "Flexible"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center py-4 md:py-10">
      <div className="text-center mb-16 max-w-3xl animate-fade-in-up">
        <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-4">
          Professional Preparation
        </span>
        <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
          Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">IELTS Exam</span>
        </h2>
        <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Experience realistic exam simulations powered by advanced AI. 
          Get instant, detailed feedback to improve your band score today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl px-2">
        {modes.map((mode, idx) => (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={`group relative bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left flex flex-col items-start overflow-hidden ${mode.border}`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${mode.color} opacity-5 rounded-bl-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500`}></div>
            
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${mode.color} text-white mb-6 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300`}>
              <mode.icon size={28} strokeWidth={2} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
              {mode.title}
            </h3>
            
            <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-grow">
              {mode.description}
            </p>
            
            <div className="w-full flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
              <span className="inline-flex items-center text-xs font-semibold text-slate-400">
                ⏱ {mode.time}
              </span>
              <span className="text-sm font-bold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                Start <ArrowRight size={14} />
              </span>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-16 w-full max-w-5xl px-2">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid-white/5 mask-image-gradient"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-4 bg-white/10 text-white rounded-2xl backdrop-blur-sm border border-white/10">
              <PenTool size={24} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-1">Have an essay ready?</h4>
              <p className="text-slate-300 text-sm">Paste your existing work for instant AI grading and feedback.</p>
            </div>
          </div>
          
          <button 
            onClick={() => onSelect(AppMode.FEEDBACK)}
            className="relative z-10 px-8 py-3 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg whitespace-nowrap"
          >
            Analyze Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;