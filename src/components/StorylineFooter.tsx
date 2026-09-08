import React from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { ActiveTab } from '../types';

interface StorylineFooterProps {
  currentTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  nextTab?: ActiveTab;
  nextLabel?: string;
  prevTab?: ActiveTab;
  prevLabel?: string;
}

export const StorylineFooter: React.FC<StorylineFooterProps> = ({
  currentTab,
  onNavigate,
  nextTab,
  nextLabel,
  prevTab,
  prevLabel
}) => {
  return (
    <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
      {prevTab ? (
        <button
          type="button"
          onClick={() => onNavigate(prevTab)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all min-h-[44px] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{prevLabel || 'Previous Step'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onNavigate('upload')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-all min-h-[44px] cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Upload / Ingestion</span>
        </button>
      )}

      {nextTab && (
        <button
          type="button"
          onClick={() => onNavigate(nextTab)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all active:scale-98 min-h-[44px] cursor-pointer"
        >
          <span>{nextLabel || 'Next Storyline Step'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
