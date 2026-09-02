import React from 'react';
import { 
  History, 
  X, 
  Trash2, 
  FileCode, 
  ShieldAlert, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { AuditHistoryItem } from '../types';

interface AuditHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: AuditHistoryItem[];
  onLoadSession: (session: AuditHistoryItem) => void;
  onDeleteSession: (id: string) => void;
  onClearAllHistory: () => void;
  currentSessionId?: string;
}

export const AuditHistoryDrawer: React.FC<AuditHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onLoadSession,
  onDeleteSession,
  onClearAllHistory,
  currentSessionId
}) => {
  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#090e1a] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Audit Session History</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                    {history.length}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Local cache of previous codebase audits
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* History Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                  <History className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">No Past Sessions Yet</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Whenever you upload code or import a GitHub repository, its full audit report will be automatically cached here for instant retrieval.
                  </p>
                </div>
              </div>
            ) : (
              history.map((item) => {
                const isSelected = currentSessionId === item.id;
                const score = item.overallScore || item.auditResult?.summary?.overallHealthScore || 80;
                const critCount = item.criticalCount ?? item.auditResult?.summary?.severityCounts?.critical ?? 0;
                const vulnTotal = item.vulnerabilitiesCount ?? item.auditResult?.summary?.totalVulnerabilities ?? 0;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/40'
                        : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate font-mono">
                            {item.repoName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{formatDate(item.timestamp)}</span>
                            <span>•</span>
                            <span>{item.filesCount} file(s)</span>
                          </div>
                        </div>

                        {/* Health Score Pill */}
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold shrink-0 ${
                          score >= 80 
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' 
                            : score >= 50
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                        }`}>
                          {score}% Health
                        </span>
                      </div>

                      {/* Findings Summary Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {vulnTotal > 0 ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 ${
                            critCount > 0
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                              : 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                          }`}>
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>{vulnTotal} vuln{vulnTotal > 1 ? 's' : ''}</span>
                            {critCount > 0 && <span className="font-bold text-rose-400">({critCount} crit)</span>}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>0 vulnerabilities</span>
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800/40 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{item.codeSmellsCount ?? item.auditResult?.summary?.totalCodeSmells ?? 0} smells</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadSession(item);
                          onClose();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white'
                        }`}
                      >
                        <span>{isSelected ? 'Active Session' : 'Load Report'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSession(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete this cached audit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          {history.length > 0 && (
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {history.length} saved session{history.length > 1 ? 's' : ''}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all audit history?')) {
                    onClearAllHistory();
                  }
                }}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All History</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
