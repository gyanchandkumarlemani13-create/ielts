import React from 'react';
import { AppMode } from '../types';
import { Sparkles, ArrowLeft, History } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentMode: AppMode;
  onGoHome: () => void;
  onShowHistory: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentMode, onGoHome, onShowHistory }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/40 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/50 shadow-sm support-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={onGoHome}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              I
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
              IELTS<span className="font-light text-slate-500">TestPro</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {currentMode !== AppMode.HISTORY && (
              <button 
                onClick={onShowHistory}
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100/50"
                title="View History"
              >
                <History size={18} />
                <span className="hidden md:inline">History</span>
              </button>
            )}

            {currentMode !== AppMode.LANDING && (
              <button 
                onClick={onGoHome}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100/50"
              >
                <ArrowLeft size={16} />
                Exit
              </button>
            )}
            
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-white/80 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
              <Sparkles size={12} className="text-indigo-500" />
              AI Powered 2.0
            </div>
          </div>
        </div>
      </header>
      
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
        {children}
      </main>
      
      <footer className="relative z-10 border-t border-slate-200/60 bg-white/40 backdrop-blur-sm py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} IELTS TestPro. <span className="text-slate-300 mx-2">|</span> Simulated Examination Environment
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;