import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  AlertTriangle, 
  FileCode,
  Sliders,
  Maximize2
} from 'lucide-react';
import { computeLineDiff, DiffLine, DiffStats } from '../utils/diffUtils';

interface NativeCodeEditorProps {
  mode: 'side-by-side' | 'inline' | 'patched' | 'original';
  originalCode: string;
  modifiedCode: string;
  language?: string;
  fontSize?: number;
  wordWrap?: boolean;
  showMinimap?: boolean;
  highlightLine?: number;
  readOnly?: boolean;
  onCodeChange?: (newCode: string) => void;
}

// Simple fast regex-based tokenizer for syntax highlighting
function highlightCodeLine(code: string, language: string = 'typescript'): React.ReactNode[] {
  if (!code) return [' '];

  // Regex patterns for key tokens
  const tokenRegex = /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|`(?:\\.|[^`])*`|\b(?:import|export|from|default|class|extends|interface|type|enum|function|const|let|var|return|if|else|switch|case|break|for|while|do|try|catch|finally|throw|new|typeof|instanceof|async|await|yield|public|private|protected|static|readonly|as|is|in|of|def|self|None|True|False|elif|lambda|pass|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|GROUP|ORDER|BY|HAVING|LIMIT)\b|\b(?:number|string|boolean|any|void|null|undefined|never|unknown|Promise|Record|Array|Map|Set|int|float|str|list|dict|tuple)\b|\b\d+(?:\.\d+)?\b|[{}()[\].,;:+\-*/%=<>!&|^~?]+|[a-zA-Z_$][a-zA-Z0-9_$]*)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      parts.push(code.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith('//') || token.startsWith('/*') || token.startsWith('#')) {
      parts.push(<span key={key} className="text-slate-400 italic">{token}</span>);
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      parts.push(<span key={key} className="text-emerald-400">{token}</span>);
    } else if (/^\d+(?:\.\d+)?$/.test(token)) {
      parts.push(<span key={key} className="text-amber-400">{token}</span>);
    } else if (/^(?:import|export|from|default|class|extends|interface|type|enum|function|const|let|var|return|if|else|switch|case|break|for|while|do|try|catch|finally|throw|new|typeof|instanceof|async|await|yield|public|private|protected|static|readonly|as|is|in|of|def|self|None|True|False|elif|lambda|pass|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|GROUP|ORDER|BY|HAVING|LIMIT)$/.test(token)) {
      parts.push(<span key={key} className="text-purple-400 font-semibold">{token}</span>);
    } else if (/^(?:number|string|boolean|any|void|null|undefined|never|unknown|Promise|Record|Array|Map|Set|int|float|str|list|dict|tuple)$/.test(token)) {
      parts.push(<span key={key} className="text-cyan-400 font-medium">{token}</span>);
    } else if (/^[A-Z][a-zA-Z0-9_$]*$/.test(token)) {
      parts.push(<span key={key} className="text-indigo-300 font-semibold">{token}</span>);
    } else if (/^[{}()[\].,;:+\-*/%=<>!&|^~?]+$/.test(token)) {
      parts.push(<span key={key} className="text-slate-400">{token}</span>);
    } else {
      parts.push(<span key={key} className="text-slate-200">{token}</span>);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < code.length) {
    parts.push(code.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [code];
}

export const NativeCodeEditor: React.FC<NativeCodeEditorProps> = ({
  mode,
  originalCode,
  modifiedCode,
  language = 'typescript',
  fontSize = 13,
  wordWrap = false,
  showMinimap = false,
  highlightLine,
  readOnly = false,
  onCodeChange
}) => {
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef<boolean>(false);

  // Compute Diff Lines for Side-by-Side and Unified views
  const { diffLines, stats } = useMemo(() => {
    return computeLineDiff(originalCode || '', modifiedCode || '');
  }, [originalCode, modifiedCode]);

  // Synchronize scrolling for split diff view
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

  const originalLines = useMemo(() => (originalCode || '').split('\n'), [originalCode]);
  const modifiedLines = useMemo(() => (modifiedCode || '').split('\n'), [modifiedCode]);

  // 1. SIDE-BY-SIDE SPLIT VIEW
  if (mode === 'side-by-side') {
    return (
      <div className="flex flex-col h-full w-full bg-[#020617] text-slate-200 select-text overflow-hidden font-mono">
        {/* Sub-header diff status */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#090e1a] border-b border-slate-800 text-[11px] text-slate-400 select-none">
          <div className="flex items-center gap-3 w-1/2 border-r border-slate-800 pr-3">
            <span className="font-bold text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              ORIGINAL SOURCE (VULNERABILITIES)
            </span>
            <span className="text-slate-400">-{stats.deletions + stats.modifications} changes</span>
          </div>
          <div className="flex items-center gap-3 w-1/2 pl-3">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              AI REFACTORED & REMEDIATED
            </span>
            <span className="text-slate-400">+{stats.additions + stats.modifications} patches</span>
          </div>
        </div>

        {/* Two Split Scrollable Panes */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Original */}
          <div
            ref={leftPaneRef}
            onScroll={handleLeftScroll}
            className="w-1/2 overflow-auto border-r border-slate-800 bg-[#020617]"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
          >
            <div className="min-w-max py-2">
              {diffLines.map((line, idx) => {
                const isDel = line.type === 'deleted' || line.type === 'modified';
                const isTargetHighlight = highlightLine && line.leftLineNum === highlightLine;

                return (
                  <div
                    key={`left-${idx}`}
                    className={`flex items-start transition-colors ${
                      isTargetHighlight
                        ? 'bg-rose-950/80 border-y border-rose-500/50'
                        : isDel
                        ? 'bg-rose-950/35 border-l-2 border-rose-500'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="w-12 shrink-0 select-none text-right pr-3 text-[11px] text-slate-400 font-mono py-0.5">
                      {line.leftLineNum ?? ''}
                    </div>
                    <div className="w-4 shrink-0 select-none text-center text-xs font-bold py-0.5">
                      {isDel && <span className="text-rose-400">-</span>}
                    </div>
                    <div className={`flex-1 pr-4 whitespace-pre py-0.5 ${isDel ? 'text-rose-200' : 'text-slate-300'}`}>
                      {line.leftContent ? highlightCodeLine(line.leftContent, language) : <span>&nbsp;</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Modified */}
          <div
            ref={rightPaneRef}
            onScroll={handleRightScroll}
            className="w-1/2 overflow-auto bg-[#020617]"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
          >
            <div className="min-w-max py-2">
              {diffLines.map((line, idx) => {
                const isAdd = line.type === 'added' || line.type === 'modified';
                const isTargetHighlight = highlightLine && line.rightLineNum === highlightLine;

                return (
                  <div
                    key={`right-${idx}`}
                    className={`flex items-start transition-colors ${
                      isTargetHighlight
                        ? 'bg-emerald-950/80 border-y border-emerald-500/50'
                        : isAdd
                        ? 'bg-emerald-950/35 border-l-2 border-emerald-500'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="w-12 shrink-0 select-none text-right pr-3 text-[11px] text-slate-400 font-mono py-0.5">
                      {line.rightLineNum ?? ''}
                    </div>
                    <div className="w-4 shrink-0 select-none text-center text-xs font-bold py-0.5">
                      {isAdd && <span className="text-emerald-400">+</span>}
                    </div>
                    <div className={`flex-1 pr-4 whitespace-pre py-0.5 ${isAdd ? 'text-emerald-200' : 'text-slate-300'}`}>
                      {line.rightContent ? highlightCodeLine(line.rightContent, language) : <span>&nbsp;</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. UNIFIED INLINE DIFF VIEW
  if (mode === 'inline') {
    return (
      <div 
        className="h-full w-full bg-[#020617] text-slate-200 overflow-auto font-mono py-2"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
      >
        <div className="min-w-max">
          {diffLines.map((line, idx) => {
            if (line.type === 'unchanged') {
              return (
                <div key={`inline-${idx}`} className="flex items-start hover:bg-slate-900/40">
                  <div className="w-10 select-none text-right pr-2 text-[11px] text-slate-400 py-0.5">{line.leftLineNum}</div>
                  <div className="w-10 select-none text-right pr-2 text-[11px] text-slate-400 py-0.5">{line.rightLineNum}</div>
                  <div className="w-5 text-center text-slate-400 py-0.5">&nbsp;</div>
                  <div className="flex-1 pr-4 whitespace-pre py-0.5 text-slate-300">
                    {highlightCodeLine(line.leftContent, language)}
                  </div>
                </div>
              );
            }

            return (
              <React.Fragment key={`inline-${idx}`}>
                {(line.type === 'deleted' || line.type === 'modified') && (
                  <div className="flex items-start bg-rose-950/40 border-l-2 border-rose-500">
                    <div className="w-10 select-none text-right pr-2 text-[11px] text-rose-400/80 py-0.5">{line.leftLineNum}</div>
                    <div className="w-10 select-none text-right pr-2 text-[11px] text-slate-400 py-0.5"></div>
                    <div className="w-5 text-center text-rose-400 font-bold py-0.5">-</div>
                    <div className="flex-1 pr-4 whitespace-pre py-0.5 text-rose-200">
                      {highlightCodeLine(line.leftContent, language)}
                    </div>
                  </div>
                )}
                {(line.type === 'added' || line.type === 'modified') && (
                  <div className="flex items-start bg-emerald-950/40 border-l-2 border-emerald-500">
                    <div className="w-10 select-none text-right pr-2 text-[11px] text-slate-400 py-0.5"></div>
                    <div className="w-10 select-none text-right pr-2 text-[11px] text-emerald-400/80 py-0.5">{line.rightLineNum}</div>
                    <div className="w-5 text-center text-emerald-400 font-bold py-0.5">+</div>
                    <div className="flex-1 pr-4 whitespace-pre py-0.5 text-emerald-200">
                      {highlightCodeLine(line.rightContent, language)}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. FULL SOURCE VIEW (Patched or Original)
  const linesToRender = mode === 'patched' ? modifiedLines : originalLines;

  return (
    <div 
      className="h-full w-full bg-[#020617] text-slate-200 overflow-auto font-mono py-2"
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
    >
      <div className="min-w-max">
        {linesToRender.map((lineText, idx) => {
          const lineNum = idx + 1;
          const isTargetHighlight = highlightLine === lineNum;

          return (
            <div
              key={`line-${idx}`}
              className={`flex items-start ${
                isTargetHighlight
                  ? 'bg-indigo-950/80 border-l-2 border-indigo-500 shadow-inner'
                  : 'hover:bg-slate-900/40'
              }`}
            >
              <div className="w-12 shrink-0 select-none text-right pr-3 text-[11px] text-slate-400 font-mono py-0.5">
                {lineNum}
              </div>
              <div className="flex-1 pr-4 whitespace-pre py-0.5 text-slate-200">
                {lineText ? highlightCodeLine(lineText, language) : <span>&nbsp;</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
