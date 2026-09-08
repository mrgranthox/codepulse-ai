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
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-full sm:w-screen max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#090D16]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Audit Session History</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                    {history.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Local cache of previous codebase audits
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Close history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* History Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto border border-slate-700">
                  <History className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">No Past Sessions Yet</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
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
                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/30'
                        : 'bg-[#090D16] hover:bg-slate-800/50 border-slate-800 hover:border-slate-700'
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          score >= 80 
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' 
                            : score >= 50
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                        }`}>
                          {score}% Health
                        </span>
                      </div>

                      {/* Finding metrics overview */}
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full border ${
                          critCount > 0 
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/50 font-bold'
                            : vulnTotal > 0
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/50 font-bold'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {vulnTotal} Vulns {critCount > 0 ? `(${critCount} Crit)` : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50 font-semibold">
                          {item.codeSmellsCount ?? 0} Smells
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 font-semibold">
                          {vulnTotal + (item.codeSmellsCount ?? 0)} Total Patches
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadSession(item);
                          onClose();
                        }}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer min-h-[40px] ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                            : 'bg-slate-850 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-750'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Active Report' : 'Restore Report'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSession(item.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
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

          {/* Drawer Footer */}
          {history.length > 0 && (
            <div className="p-4 border-t border-slate-800/80 bg-[#090D16] flex items-center justify-between">
              <button
                type="button"
                onClick={onClearAllHistory}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 cursor-pointer min-h-[44px] py-2 px-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Saved Audits</span>
              </button>

              <span className="text-[10px] text-slate-500 font-mono">
                Stored in LocalStorage
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
