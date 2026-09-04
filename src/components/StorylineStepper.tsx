import React from 'react';
import { 
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
  { id: 'overview', stepNumber: 1, label: 'Executive Dashboard', shortLabel: '1. Overview', icon: Activity },
  { id: 'architecture', stepNumber: 2, label: 'System Architecture', shortLabel: '2. Architecture', icon: Layers },
  { id: 'security', stepNumber: 3, label: 'Security & OWASP', shortLabel: '3. Security', icon: ShieldAlert },
  { id: 'refactoring', stepNumber: 4, label: 'Code Refactorings', shortLabel: '4. Refactor', icon: Sparkles },
  { id: 'export', stepNumber: 5, label: 'Report & Export', shortLabel: '5. Export', icon: Download }
];

export const StorylineStepper: React.FC<StorylineStepperProps> = ({
  activeTab,
  setActiveTab,
  auditResult
}) => {
  const currentStep = STORYLINE_STEPS.find(s => s.id === activeTab) || STORYLINE_STEPS[0];
  const hasAudit = auditResult !== null;

  return (
    <nav aria-label="Audit Process Steps" className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-2.5 mb-6 backdrop-blur-md shadow-xl overflow-hidden">
      <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pb-1 sm:pb-0 px-0.5 scroll-smooth">
        {STORYLINE_STEPS.map((step, idx) => {
          const isActive = activeTab === step.id;
          const isPassed = hasAudit && step.stepNumber < currentStep.stepNumber;
          const isAccessible = hasAudit;

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
                className={`flex-1 min-w-[110px] sm:min-w-0 flex items-center justify-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap group cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30 font-semibold'
                    : isAccessible
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800 hover:-translate-y-0.5'
                    : 'text-slate-600 cursor-not-allowed opacity-40'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isPassed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    step.stepNumber
                  )}
                </div>

                <span className="hidden xl:inline font-semibold tracking-tight">{step.label}</span>
                <span className="xl:hidden font-semibold tracking-tight">{step.shortLabel}</span>

                {/* Specific vulnerability badge if available */}
                {step.id === 'security' && (auditResult?.summary?.totalVulnerabilities ?? 0) > 0 && (
                  <span 
                    title={`${auditResult?.summary?.totalVulnerabilities} Security Vulnerabilities`}
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-indigo-900 text-indigo-100' : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                    }`}
                  >
                    {auditResult?.summary?.totalVulnerabilities}
                  </span>
                )}

                {/* Specific code smells badge if available */}
                {step.id === 'refactoring' && (auditResult?.summary?.totalCodeSmells ?? 0) > 0 && (
                  <span 
                    title={`${auditResult?.summary?.totalCodeSmells} Code Smells (${(auditResult?.summary?.totalCodeSmells ?? 0) + (auditResult?.summary?.totalVulnerabilities ?? 0)} Total Patches)`}
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-indigo-900 text-indigo-100' : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                    }`}
                  >
                    {auditResult?.summary?.totalCodeSmells}
                  </span>
                )}
              </button>

              {idx < STORYLINE_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-700 shrink-0 hidden md:block select-none" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
