import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Activity, 
  Layers, 
  TrendingDown, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Clock,
  Code2,
  FileText,
  History
} from 'lucide-react';
import { AuditResult, ActiveTab } from '../types';
import { StorylineFooter } from './StorylineFooter';

interface OverviewDashboardProps {
  auditResult: AuditResult | null;
  setActiveTab: (tab: ActiveTab) => void;
  onReAudit: () => void;
  isLoading: boolean;
  onOpenHistory?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  auditResult,
  setActiveTab,
  onReAudit,
  isLoading,
  onOpenHistory
}) => {
  if (!auditResult) {
    return (
      <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Audit Data Available Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Upload your codebase files or select an enterprise preset to run the Gemini-powered architectural and security audit.
        </p>
        <button
          onClick={() => setActiveTab('upload')}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Go to Upload & Audit
        </button>
      </div>
    );
  }

  const { summary, architecture, securityAudit, codeSmells, astMetrics } = auditResult;

  // Health Score Color
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 ring-emerald-500/20';
    if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/30 ring-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30 ring-rose-500/20';
  };

  const getComplexityBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'extreme':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Repo Name & Scan Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {auditResult.repoName || 'Codebase Audit Report'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {auditResult.scannedFilesCount} Files
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {auditResult.executionTimeMs}ms execution
              </span>
              <span>•</span>
              <span className="font-mono text-indigo-400">{auditResult.modelUsed}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="View past audit sessions"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Past Sessions</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('export')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Full Report</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-colors"
          >
            <span>View Architecture</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Metrics 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Health Score */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Overall Health</p>
            <p className="text-2xl font-bold text-white mt-1">
              {summary.overallHealthScore}
              <span className="text-slate-500 text-sm font-normal">/100</span>
            </p>
          </div>
          <div className="h-11 w-11 border-2 border-emerald-500/30 rounded-full flex items-center justify-center">
            <div className={`h-7 w-7 border-2 ${summary.overallHealthScore >= 80 ? 'border-emerald-500' : summary.overallHealthScore >= 50 ? 'border-amber-500' : 'border-rose-500'} rounded-full border-t-transparent rotate-45`}></div>
          </div>
        </div>

        {/* Card 2: Vulnerabilities */}
        <div 
          onClick={() => setActiveTab('security')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-rose-500/30 transition-all cursor-pointer shadow-lg group"
        >
          <p className="text-xs text-slate-500 uppercase font-semibold">Vulnerabilities</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-rose-500">
              {summary.totalVulnerabilities}
            </p>
            {summary.severityCounts.critical > 0 ? (
              <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded font-bold uppercase tracking-wider">
                {summary.severityCounts.critical} CRITICAL
              </span>
            ) : summary.severityCounts.high > 0 ? (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded font-bold uppercase tracking-wider">
                {summary.severityCounts.high} HIGH
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-bold uppercase tracking-wider">
                PASSED
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Cyclomatic Complexity */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <p className="text-xs text-slate-500 uppercase font-semibold">Cyclomatic Complexity</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-amber-500">
              {summary.cyclomaticComplexity}
            </p>
            <span className="text-xs font-mono text-slate-400">
              {summary.maintainabilityScore}% MI
            </span>
          </div>
        </div>

        {/* Card 4: Code Smells */}
        <div 
          onClick={() => setActiveTab('refactoring')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-indigo-500/30 transition-all cursor-pointer shadow-lg group"
        >
          <p className="text-xs text-slate-500 uppercase font-semibold">Code Smells</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-bold text-indigo-400">
              {summary.totalCodeSmells}
            </p>
            <span className="text-[11px] text-slate-500 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
              Refactorings &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Second Row: Key Takeaways & AST Token Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Key Takeaways (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Executive Audit Takeaways & Critical Priorities
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              AI Synthesis
            </span>
          </div>

          <div className="space-y-2.5">
            {summary.keyTakeaways.map((takeaway, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#020617] border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {takeaway}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AST Context Window Efficiency & Token Metrics (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  AST Distillation & Efficiency
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                -{astMetrics.astReductionPercentage}% Tokens
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Structural skeleton extraction compresses AST payloads to fit full repositories into Gemini 2M context windows with zero loss of semantic linkage.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#020617] border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Lines of Code
                </span>
                <span className="text-lg font-bold text-white font-mono">
                  {astMetrics.totalLinesOfCode}
                </span>
              </div>
              <div className="p-3 bg-[#020617] border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Functions / Handlers
                </span>
                <span className="text-lg font-bold text-white font-mono">
                  {astMetrics.totalFunctions}
                </span>
              </div>
              <div className="p-3 bg-[#020617] border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Classes & Modules
                </span>
                <span className="text-lg font-bold text-white font-mono">
                  {astMetrics.totalClassesOrModules}
                </span>
              </div>
              <div className="p-3 bg-[#020617] border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Tokens Ingested
                </span>
                <span className="text-lg font-bold text-indigo-400 font-mono">
                  {astMetrics.estimatedTokenCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              WASM Tree-Sitter Parser
            </span>
            <span className="font-mono text-[11px] text-slate-500">&lt; 500ms SLA</span>
          </div>
        </div>
      </div>

      {/* Storyline Navigation Footer */}
      <StorylineFooter
        currentTab="overview"
        onNavigate={setActiveTab}
        prevTab="upload"
        prevLabel="← Back to Ingestion"
        nextTab="architecture"
        nextLabel="Explore System Architecture (Step 4) →"
      />
    </div>
  );
};
