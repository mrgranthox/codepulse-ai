import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  FileCode, 
  Download, 
  CheckCircle2,
  RefreshCw,
  History,
  Plus,
  ArrowRight
} from 'lucide-react';
import { ActiveTab, AuditResult } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  auditResult: AuditResult | null;
  isLoading: boolean;
  onRunAudit: () => void;
  onNewAudit: () => void;
  hasFiles: boolean;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  auditResult,
  isLoading,
  onRunAudit,
  onNewAudit,
  hasFiles,
  onOpenHistory,
  historyCount
}) => {
  const isExtendedWorkspace = activeTab !== 'upload' && activeTab !== 'execution' && auditResult !== null;
  const vulnTotal = auditResult?.summary.totalVulnerabilities ?? 0;
  const smellsTotal = auditResult?.summary.totalCodeSmells ?? 0;
  const criticalCount = auditResult?.summary.severityCounts.critical ?? 0;
  const healthScore = auditResult?.summary.overallHealthScore ?? 92;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNewAudit}
              className="flex items-center gap-3 group text-left"
            >
              <div className="w-8 h-8 bg-indigo-600 group-hover:bg-indigo-500 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/30 transition-all">
                <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                    CodePulse AI
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800/40">
                    Enterprise
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Zero-Trust Neural AST Engine
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Right Status Controls & Actions */}
          <div className="flex items-center gap-2.5">
            {/* System Health Metric (Only in extended workspace) */}
            {isExtendedWorkspace && (
              <div className="hidden xl:flex flex-col w-28 mr-1">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span className="text-slate-500 uppercase font-semibold text-[9px]">HEALTH</span>
                  <span className="font-mono text-emerald-400 font-semibold">{healthScore}%</span>
                </div>
                <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${healthScore}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* In upload mode, if there's already an active report in memory, offer Quick Return button */}
            {activeTab === 'upload' && auditResult && (
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 text-xs font-semibold text-indigo-300 hover:text-white transition-all shadow-sm"
              >
                <span>View Last Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* History Dropdown / Drawer Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-indigo-400 transition-colors shadow-sm"
              title="View past saved audit reports"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                  {historyCount}
                </span>
              )}
            </button>

            {/* In Extended Workspace: "+ New Audit" button (like "+ New Chat" in Claude/ChatGPT) */}
            {isExtendedWorkspace ? (
              <button
                type="button"
                onClick={onNewAudit}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Audit</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Tab Navigation ONLY shown in Extended Workspace (after processing completes or when viewing past session) */}
        {isExtendedWorkspace && (
          <div className="flex items-center space-x-1.5 overflow-x-auto py-2.5 border-t border-slate-800 no-scrollbar animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Overview Dashboard</span>
              {auditResult && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  auditResult.summary.overallHealthScore >= 80 
                    ? 'bg-emerald-500/15 text-emerald-400' 
                    : auditResult.summary.overallHealthScore >= 50
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-rose-500/15 text-rose-400'
                }`}>
                  {auditResult.summary.overallHealthScore}%
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'architecture'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Architecture Visualizer</span>
              {auditResult?.architecture?.components && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  {auditResult.architecture.components.length} nodes
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Security & OWASP Audit</span>
              {vulnTotal > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1 ${
                  criticalCount > 0 ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {vulnTotal}
                  {criticalCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('refactoring')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'refactoring'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Refactoring & Smells</span>
              {smellsTotal > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {smellsTotal}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'export'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

