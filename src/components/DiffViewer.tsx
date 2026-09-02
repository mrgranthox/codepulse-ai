import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CodeFile, 
  AuditResult 
} from '../types';
import { 
  getFileSuggestions, 
  generateFullRefactoredCode, 
  computeLineDiff, 
  FileSuggestion 
} from '../utils/diffUtils';
import { 
  Check, 
  Copy, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  FileCode, 
  RefreshCw,
  GitCompare,
  Layers,
  Zap,
  Info
} from 'lucide-react';

interface DiffViewerProps {
  activeFile: CodeFile;
  auditResult: AuditResult | null;
  onApplyRefactoredCode: (updatedContent: string) => void;
  onRunAudit: () => void;
  isLoading: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  activeFile,
  auditResult,
  onApplyRefactoredCode,
  onRunAudit,
  isLoading
}) => {
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [appliedToast, setAppliedToast] = useState<boolean>(false);

  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef<boolean>(false);

  // Synchronized scrolling between left and right diff panes
  const handleLeftScroll = () => {
    if (!leftPaneRef.current || !rightPaneRef.current || isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    rightPaneRef.current.scrollTop = leftPaneRef.current.scrollTop;
    rightPaneRef.current.scrollLeft = leftPaneRef.current.scrollLeft;
    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 20);
  };

  const handleRightScroll = () => {
    if (!leftPaneRef.current || !rightPaneRef.current || isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    leftPaneRef.current.scrollTop = rightPaneRef.current.scrollTop;
    leftPaneRef.current.scrollLeft = rightPaneRef.current.scrollLeft;
    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 20);
  };

  // Extract all suggestions for active file
  const suggestions = useMemo(() => {
    return getFileSuggestions(activeFile, auditResult);
  }, [activeFile, auditResult]);

  // Determine active suggestion or full-file combined refactor
  const activeSuggestion = useMemo(() => {
    if (selectedSuggestionId === 'all') return null;
    return suggestions.find((s) => s.id === selectedSuggestionId) || null;
  }, [selectedSuggestionId, suggestions]);

  // Compute original vs refactored strings to diff
  const { originalCodeToCompare, refactoredCodeToCompare } = useMemo(() => {
    if (activeSuggestion) {
      return {
        originalCodeToCompare: activeSuggestion.originalSnippet,
        refactoredCodeToCompare: activeSuggestion.refactoredSnippet
      };
    }

    // Combined Full File
    const fullRefactored = generateFullRefactoredCode(activeFile, suggestions);
    return {
      originalCodeToCompare: activeFile.content,
      refactoredCodeToCompare: fullRefactored
    };
  }, [activeFile, suggestions, activeSuggestion]);

  // Calculate line diff
  const { diffLines, stats } = useMemo(() => {
    return computeLineDiff(originalCodeToCompare, refactoredCodeToCompare);
  }, [originalCodeToCompare, refactoredCodeToCompare]);

  // Handle Apply Refactoring
  const handleApply = () => {
    if (activeSuggestion) {
      // Apply single snippet replacement into file
      const updated = activeFile.content.replace(
        activeSuggestion.originalSnippet.trim(),
        activeSuggestion.refactoredSnippet.trim()
      );
      onApplyRefactoredCode(updated);
    } else {
      // Apply full combined refactoring
      onApplyRefactoredCode(refactoredCodeToCompare);
    }
    setAppliedToast(true);
    setTimeout(() => setAppliedToast(false), 3000);
  };

  const handleCopyRefactored = () => {
    navigator.clipboard.writeText(refactoredCodeToCompare);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If no audit has been run yet
  if (!auditResult) {
    return (
      <div className="p-8 sm:p-12 text-center bg-[#020617] border border-slate-800 rounded-xl flex flex-col items-center justify-center min-h-[380px] space-y-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <GitCompare className="w-6 h-6" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h3 className="text-sm font-bold text-white">
            No Audit Suggestions Generated Yet
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Run an AST and OWASP security audit to automatically generate side-by-side refactoring and vulnerability patches for <span className="font-mono text-indigo-300">{activeFile.name}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={onRunAudit}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Abstract Syntax Tree...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Execute Real-Time Audit</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#020617] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Diff Control Bar */}
      <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Suggestion Target Selector */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Diff Target:
          </span>

          <div className="flex items-center gap-1 bg-[#020617] p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSelectedSuggestionId('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedSuggestionId === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>Full File (Combined)</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-950/80 border border-indigo-700/50 text-[10px] font-mono text-indigo-200">
                {suggestions.length}
              </span>
            </button>

            {suggestions.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedSuggestionId(item.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedSuggestionId === item.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={item.title}
              >
                {item.type === 'security' ? (
                  <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                ) : (
                  <Sparkles className="w-3 h-3 text-indigo-300 shrink-0" />
                )}
                <span className="truncate max-w-[140px]">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions & Stats */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* Diff Stats Badges */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] px-2.5 py-1 bg-[#020617] rounded-lg border border-slate-800">
            <span className="text-emerald-400">+{stats.additions + stats.modifications}</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400">-{stats.deletions + stats.modifications}</span>
          </div>

          <button
            type="button"
            onClick={handleCopyRefactored}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Copy Refactored Code to Clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={stats.totalChanges === 0}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/30 transition-all active:scale-95"
            title="Apply suggested refactored code to the active file"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{activeSuggestion ? 'Apply Suggestion' : 'Apply All to File'}</span>
          </button>
        </div>
      </div>

      {/* Applied Confirmation Toast */}
      {appliedToast && (
        <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Refactored code successfully applied to <strong>{activeFile.name}</strong>!</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">File Updated In Memory</span>
        </div>
      )}

      {/* Suggestion Context Header (if specific item selected) */}
      {activeSuggestion && (
        <div className="p-3 bg-[#020617] border-b border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              activeSuggestion.type === 'security'
                ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
            }`}>
              {activeSuggestion.badge}
            </span>
            <span className="font-semibold text-slate-200 truncate">
              {activeSuggestion.title}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-xl">
            {activeSuggestion.explanation}
          </p>
        </div>
      )}

      {/* Side-by-Side Dual Pane Header */}
      <div className="grid grid-cols-2 bg-[#020617] border-b border-slate-800 text-xs font-mono select-none">
        {/* Left Column Header */}
        <div className="px-4 py-2 border-r border-slate-800 flex items-center justify-between bg-slate-900/60 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="font-semibold text-slate-300">Original Code (Current)</span>
          </div>
          <span className="text-[11px] text-slate-500">{activeFile.name}</span>
        </div>

        {/* Right Column Header */}
        <div className="px-4 py-2 flex items-center justify-between bg-slate-900/60 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-emerald-400">Suggested Refactored Version</span>
          </div>
          <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
            AI Hardened
          </span>
        </div>
      </div>

      {/* Side-by-Side Diff Content Area */}
      <div className="grid grid-cols-2 min-h-[380px] max-h-[500px] overflow-hidden text-xs font-mono bg-[#020617]">
        {/* Left Pane: Original */}
        <div
          ref={leftPaneRef}
          onScroll={handleLeftScroll}
          className="border-r border-slate-800 overflow-y-auto overflow-x-auto selection:bg-rose-500/20"
        >
          <div className="py-2">
            {diffLines.map((line, idx) => {
              const isDel = line.type === 'deleted' || line.type === 'modified';
              return (
                <div
                  key={`left-${idx}`}
                  className={`flex leading-5 transition-colors ${
                    isDel
                      ? 'bg-rose-950/30 text-rose-200 border-l-2 border-rose-500'
                      : line.type === 'added'
                      ? 'bg-slate-950/40 text-transparent select-none'
                      : 'text-slate-300 hover:bg-slate-900/40'
                  }`}
                >
                  {/* Line Number */}
                  <div className="w-10 shrink-0 text-right pr-2 select-none text-slate-600 border-r border-slate-800/60 text-[11px]">
                    {line.leftLineNum || ''}
                  </div>

                  {/* Diff Marker Indicator */}
                  <div className="w-5 shrink-0 text-center select-none font-bold text-rose-400">
                    {isDel ? '-' : ''}
                  </div>

                  {/* Line Code */}
                  <pre className="pr-4 whitespace-pre font-mono text-[12px] flex-1">
                    {line.leftContent || ' '}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Refactored */}
        <div
          ref={rightPaneRef}
          onScroll={handleRightScroll}
          className="overflow-y-auto overflow-x-auto selection:bg-emerald-500/20"
        >
          <div className="py-2">
            {diffLines.map((line, idx) => {
              const isAdd = line.type === 'added' || line.type === 'modified';
              return (
                <div
                  key={`right-${idx}`}
                  className={`flex leading-5 transition-colors ${
                    isAdd
                      ? 'bg-emerald-950/30 text-emerald-200 border-l-2 border-emerald-500'
                      : line.type === 'deleted'
                      ? 'bg-slate-950/40 text-transparent select-none'
                      : 'text-slate-300 hover:bg-slate-900/40'
                  }`}
                >
                  {/* Line Number */}
                  <div className="w-10 shrink-0 text-right pr-2 select-none text-slate-600 border-r border-slate-800/60 text-[11px]">
                    {line.rightLineNum || ''}
                  </div>

                  {/* Diff Marker Indicator */}
                  <div className="w-5 shrink-0 text-center select-none font-bold text-emerald-400">
                    {isAdd ? '+' : ''}
                  </div>

                  {/* Line Code */}
                  <pre className="pr-4 whitespace-pre font-mono text-[12px] flex-1">
                    {line.rightContent || ' '}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info & Benefits */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            {stats.totalChanges > 0 ? (
              <>
                Detected <strong className="text-white">{stats.totalChanges}</strong> modification lines across{' '}
                <strong className="text-indigo-300">{suggestions.length}</strong> recommendations.
              </>
            ) : (
              'Code matches the suggested version with 0 outstanding diffs.'
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-rose-500 inline-block"></span> Original
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"></span> Refactored
          </span>
        </div>
      </div>
    </div>
  );
};
