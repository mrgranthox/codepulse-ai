import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Copy, 
  Zap, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  FileCode2,
  TrendingUp,
  SplitSquareVertical,
  Columns2,
  Code
} from 'lucide-react';
import { DiffEditor } from '@monaco-editor/react';
import { CodeSmell, ActiveTab } from '../types';
import { StorylineFooter } from './StorylineFooter';

interface RefactoringViewProps {
  smells: CodeSmell[];
  onNavigate?: (tab: ActiveTab) => void;
}

export const RefactoringView: React.FC<RefactoringViewProps> = ({ smells, onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'inline'>('side-by-side');

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLanguageFromPath = (path: string): string => {
    if (!path) return 'typescript';
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'js': case 'jsx': case 'mjs': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'java': return 'java';
      case 'json': return 'json';
      case 'sql': return 'sql';
      case 'yaml': case 'yml': return 'yaml';
      case 'html': return 'html';
      case 'css': return 'css';
      default: return 'typescript';
    }
  };

  const categories = ['All', 'Anti-Pattern', 'Missing Error Handling', 'Tight Coupling', 'Performance Bottleneck', 'Dead Code', 'Complexity'];

  const filteredSmells = smells.filter((smell) => {
    if (selectedCategory === 'All') return true;
    return smell.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Performance Bottleneck':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Anti-Pattern':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Tight Coupling':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'Missing Error Handling':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Monaco Diff Refactoring & Code Debt Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Side-by-side Monaco diff comparison of original code smells versus AI-recommended clean implementations
          </p>
        </div>

        {/* Global Diff Layout Controls & Category Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Diff View Toggle */}
          <div className="flex items-center bg-[#020617] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setDiffMode('side-by-side')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                diffMode === 'side-by-side'
                  ? 'bg-indigo-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              type="button"
              onClick={() => setDiffMode('inline')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                diffMode === 'inline'
                  ? 'bg-indigo-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex items-center space-x-1 p-0.5 bg-[#020617] border border-slate-800 rounded-lg overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? smells.length
                  : smells.filter((s) => s.category.toLowerCase().includes(cat.toLowerCase())).length;

              if (count === 0 && cat !== 'All') return null;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Code Smells Breakdown */}
      {filteredSmells.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Code Smells Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Codebase structure meets high maintainability and clean-code benchmarks.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSmells.map((smell, sIdx) => {
            const lang = getLanguageFromPath(smell.filePath);
            return (
              <div
                key={smell.id || `smell-${sIdx}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-xl transition-all"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 bg-[#020617] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold shrink-0">
                      {smell.id.split('-')[1] || `${sIdx + 1}`}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {smell.title}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryBadge(smell.category)}`}>
                          {smell.category}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {smell.severity} Impact
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                      {smell.filePath}:{smell.lineStart}-{smell.lineEnd}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(smell.id, smell.refactoredCode)}
                      className="px-3 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Copy Refactored Code"
                    >
                      {copiedId === smell.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span>{copiedId === smell.id ? 'Copied' : 'Copy Solution'}</span>
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Explanation */}
                  <div className="p-3.5 bg-[#020617] border border-slate-800 rounded-lg space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                      Structural Anti-Pattern Analysis
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {smell.explanation}
                    </p>
                  </div>

                  {/* Monaco Diff Editor Card Container */}
                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#020617] shadow-inner">
                    {/* Diff Header Bar */}
                    <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Original (Smell)</span>
                        </span>
                        <span className="text-slate-600 font-mono">⟷</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Refactored (Clean Solution)</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                          {lang}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                          Monaco Diff Engine
                        </span>
                      </div>
                    </div>

                    {/* Monaco Diff Component */}
                    <div className="h-[280px] w-full">
                      <DiffEditor
                        height="280px"
                        language={lang}
                        original={smell.snippet}
                        modified={smell.refactoredCode}
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          renderSideBySide: diffMode === 'side-by-side',
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 12,
                          lineNumbers: 'on',
                          renderOverviewRuler: false,
                          wordWrap: 'on',
                          diffWordWrap: 'on',
                          automaticLayout: true,
                          padding: { top: 8, bottom: 8 },
                          scrollbar: {
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8
                          }
                        }}
                        loading={
                          <div className="h-[280px] flex items-center justify-center bg-slate-950 text-slate-400 text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                              <span>Loading Monaco Diff Engine...</span>
                            </div>
                          </div>
                        }
                      />
                    </div>
                  </div>

                  {/* Tangible Benefits */}
                  {smell.benefits && smell.benefits.length > 0 && (
                    <div className="p-3 bg-[#020617] border border-slate-800 rounded-lg space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Engineering & Performance Benefits:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {smell.benefits.map((benefit, bIdx) => (
                          <div
                            key={bIdx}
                            className="p-2 bg-slate-900 border border-slate-800 rounded-md text-[11px] text-slate-300 font-medium flex items-start gap-1.5"
                          >
                            <span className="text-emerald-400 shrink-0">✓</span>
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Storyline Navigation Footer */}
      {onNavigate && (
        <StorylineFooter
          currentTab="refactoring"
          onNavigate={onNavigate}
          prevTab="security"
          prevLabel="← Back to Security & OWASP"
          nextTab="export"
          nextLabel="Generate Certification Report (Step 7) →"
        />
      )}
    </div>
  );
};

