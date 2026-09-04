import React, { useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  FileCode, 
  CheckCircle2, 
  X, 
  HardDrive, 
  Zap, 
  Eye, 
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { MemoryOptimizationPreview } from '../utils/memoryOptimizer';

interface ClearanceConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview: MemoryOptimizationPreview | null;
  repoName: string;
  onConfirmOptimize: (dontAskAgain?: boolean) => void;
  onRetainFullSource: (dontAskAgain?: boolean) => void;
}

export const ClearanceConsentModal: React.FC<ClearanceConsentModalProps> = ({
  isOpen,
  onClose,
  preview,
  repoName,
  onConfirmOptimize,
  onRetainFullSource
}) => {
  const [activeTab, setActiveTab] = useState<'clean' | 'retained'>('clean');
  const [dontAskAgain, setDontAskAgain] = useState<boolean>(false);

  if (!isOpen || !preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#0D121F] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-t-indigo-500/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-[#0B0F17] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Deep-Memory Clearance & Cache Consent
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  Batch Optimization
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit complete for <span className="text-indigo-300 font-mono font-medium">{repoName || 'Codebase'}</span>. Choose how source buffers are managed in browser memory.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                Total Codebase
              </span>
              <p className="text-lg font-bold text-white font-mono">
                {preview.totalFiles} <span className="text-xs font-normal text-slate-400">files</span>
              </p>
              <span className="text-[10px] font-mono text-slate-400">
                ~{preview.totalHeapMb} MB in heap
              </span>
            </div>

            <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Retained Files
              </span>
              <p className="text-lg font-bold text-indigo-300 font-mono">
                {preview.issueFilesCount} <span className="text-xs font-normal text-indigo-400">files</span>
              </p>
              <span className="text-[10px] font-mono text-indigo-400">
                100% raw source kept
              </span>
            </div>

            <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 block flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Estimated RAM Freed
              </span>
              <p className="text-lg font-bold text-emerald-400 font-mono">
                ~{preview.estimatedHeapFreedMb} <span className="text-xs font-normal text-emerald-300">MB</span>
              </p>
              <span className="text-[10px] font-mono text-emerald-400">
                {preview.cleanFilesCount} clean files released
              </span>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>How Deep-Memory Optimization Works:</span>
            </div>
            <ul className="space-y-1.5 text-slate-400 text-[11px] leading-relaxed pl-5 list-disc">
              <li>
                <strong className="text-slate-300">Targeted Retention:</strong> All {preview.issueFilesCount} files containing security vulnerabilities, code smells, or active IDE selections retain their full verbatim source code.
              </li>
              <li>
                <strong className="text-slate-300">Buffer Clearance:</strong> The {preview.cleanFilesCount} clean files (0 issues found) will release raw text buffers, preventing browser tab crashes during massive multi-hundred file audits.
              </li>
              <li>
                <strong className="text-slate-300">Zero Metric Loss:</strong> Full AST metrics, dependency graphs, C4 diagrams, and aggregate security ratings remain 100% intact.
              </li>
            </ul>
          </div>

          {/* File Lists Tabs */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0B0F17]">
            <div className="flex items-center border-b border-slate-800 bg-slate-900/60 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('clean')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'clean'
                    ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Clean Files for Memory Pruning ({preview.cleanFilesCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('retained')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'retained'
                    ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-800/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Files Retained Full Source ({preview.issueFilesCount})</span>
              </button>
            </div>

            <div className="p-3 max-h-40 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-1">
              {activeTab === 'clean' ? (
                preview.cleanFilesList.length > 0 ? (
                  preview.cleanFilesList.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-400 hover:text-slate-200 py-0.5">
                      <span className="truncate max-w-[80%] flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{file.path}</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold shrink-0">Clean (0 issues)</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500 text-xs font-sans">
                    All scanned files contain findings or active selections.
                  </div>
                )
              ) : (
                preview.issueFilesList.length > 0 ? (
                  preview.issueFilesList.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300 hover:text-white py-0.5">
                      <span className="truncate max-w-[75%] flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{file.path}</span>
                      </span>
                      <span className="text-[10px] text-indigo-300 font-semibold shrink-0">
                        {file.issuesCount > 0 ? `${file.issuesCount} findings` : 'Active Editor File'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500 text-xs font-sans">
                    No files require mandatory retention.
                  </div>
                )
              )}
            </div>
          </div>

          {/* Don't ask again checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="dontAskAgain"
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="dontAskAgain" className="text-xs text-slate-400 cursor-pointer select-none">
              Remember my choice for the remainder of this browser session
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0B0F17] flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onRetainFullSource(dontAskAgain)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all hover:text-white cursor-pointer flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>Retain Full Source Files Locally</span>
          </button>

          <button
            type="button"
            onClick={() => onConfirmOptimize(dontAskAgain)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Optimize Memory & Release Buffers (~{preview.estimatedHeapFreedMb} MB)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
