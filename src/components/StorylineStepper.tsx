import React from 'react';
import { 
  FileCode, 
  Cpu, 
  Activity, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  Download,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { ActiveTab, AuditResult } from '../types';

interface StorylineStepperProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  auditResult: AuditResult | null;
  isLoading: boolean;
}

export const STORYLINE_STEPS: Array<{
  id: ActiveTab;
  stepNumber: number;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}> = [
  { id: 'upload', stepNumber: 1, label: 'Upload & Ingest', shortLabel: '1. Ingestion', icon: FileCode },
  { id: 'execution', stepNumber: 2, label: 'Neural AST Scanner', shortLabel: '2. Scanner', icon: Cpu },
  { id: 'overview', stepNumber: 3, label: 'Executive Dashboard', shortLabel: '3. Overview', icon: Activity },
  { id: 'architecture', stepNumber: 4, label: 'System Architecture', shortLabel: '4. Architecture', icon: Layers },
  { id: 'security', stepNumber: 5, label: 'Security & OWASP', shortLabel: '5. Security', icon: ShieldAlert },
  { id: 'refactoring', stepNumber: 6, label: 'Code Refactorings', shortLabel: '6. Refactor', icon: Sparkles },
  { id: 'export', stepNumber: 7, label: 'Report & Export', shortLabel: '7. Export', icon: Download }
];

export const StorylineStepper: React.FC<StorylineStepperProps> = ({
  activeTab,
  setActiveTab,
  auditResult,
  isLoading
}) => {
  const currentStep = STORYLINE_STEPS.find(s => s.id === activeTab) || STORYLINE_STEPS[0];
  const hasAudit = auditResult !== null;

  return (
    <div className="w-full bg-[#090e1a]/80 border border-slate-800/80 rounded-xl p-2.5 mb-6 backdrop-blur-md">
      <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-1 sm:gap-2">
        {STORYLINE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeTab === step.id;
          const isPassed = hasAudit && step.stepNumber < currentStep.stepNumber;
          const isAccessible = step.id === 'upload' || (hasAudit && step.id !== 'execution') || (isLoading && step.id === 'execution');

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => {
                  if (isAccessible) {
                    setActiveTab(step.id);
                  }
                }}
                disabled={!isAccessible}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                    : isAccessible
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isPassed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    step.stepNumber
                  )}
                </div>

                <span className="hidden md:inline font-semibold">{step.label}</span>
                <span className="md:hidden font-semibold">{step.shortLabel}</span>

                {/* Specific badge if available */}
                {step.id === 'security' && (auditResult?.summary?.totalVulnerabilities ?? 0) > 0 && (
                  <span className={`text-[9px] font-mono px-1 rounded ${
                    isActive ? 'bg-indigo-900 text-indigo-100' : 'bg-rose-950 text-rose-300 border border-rose-800/40'
                  }`}>
                    {auditResult?.summary?.totalVulnerabilities}
                  </span>
                )}
              </button>

              {idx < STORYLINE_STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-700 shrink-0 hidden sm:block select-none" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
