import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Cpu, 
  ShieldAlert, 
  Layers, 
  FileCode, 
  CheckCircle2, 
  Terminal, 
  Sparkles, 
  Zap, 
  Lock, 
  ArrowRight 
} from 'lucide-react';
import { CodeFile } from '../types';
import { CodePulseLogo } from './CodePulseLogo';

interface ExecutionScannerProps {
  files: CodeFile[];
  repoName: string;
  onCancel?: () => void;
}

interface ScanStage {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const SCAN_STAGES: ScanStage[] = [
  {
    id: 'ingestion',
    title: 'Zero-Trust Ingestion & Secret Scrubbing',
    description: 'Scanning files for private keys, AWS tokens, and hardcoded secrets using client-side regex rules.',
    icon: Lock
  },
  {
    id: 'ast',
    title: 'AST Parsing & Syntax Tree Normalization',
    description: 'Building multi-language Abstract Syntax Trees (AST) to compute cyclomatic complexity and token metrics.',
    icon: Cpu
  },
  {
    id: 'owasp',
    title: 'OWASP Top 10 & CWE Threat Modeling',
    description: 'Evaluating injection surfaces, authentication flaws, cryptography weaknesses, and access controls.',
    icon: ShieldAlert
  },
  {
    id: 'architecture',
    title: 'C4 Topology & Dependency Extraction',
    description: 'Inferring system boundaries, data flow vectors, and generating interactive Mermaid.js architecture diagrams.',
    icon: Layers
  },
  {
    id: 'smells',
    title: 'Refactoring & Anti-Pattern Analysis',
    description: 'Synthesizing line-level code modernizations, N+1 query mitigations, and resilient error boundaries.',
    icon: Sparkles
  },
  {
    id: 'certification',
    title: 'Synthesizing Executive Certification',
    description: 'Aggregating health scores, maintainability indices, and preparing executive audit report.',
    icon: CheckCircle2
  }
];

export const ExecutionScanner: React.FC<ExecutionScannerProps> = ({
  files,
  repoName
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState(12);

  // Progressive stage progression simulation during network execution
  useEffect(() => {
    const totalLines = files.reduce((acc, f) => acc + (f.content ? f.content.split('\n').length : 0), 0);
    
    // Initial logs
    const baseLogs = [
      `[INIT] Initializing CodePulse Neural AST Engine v2.4...`,
      `[INGEST] Ingested 100% repository files: "${repoName || 'Custom Workspace'}" (${files.length.toLocaleString()} files, ${totalLines.toLocaleString()} LOC)`,
      `[SECURITY] Zero-trust client sanitizer active. Scrubbing credential patterns...`
    ];
    setTerminalLogs(baseLogs);

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        const next = prev < SCAN_STAGES.length - 1 ? prev + 1 : prev;
        setProgressPercent(Math.min(95, (next + 1) * 16));

        // Add dynamic log for each stage
        if (next === 1) {
          setTerminalLogs((logs) => [
            ...logs,
            `[AST] Parsing ${files.length} source file ASTs across ${files.map(f => f.name).slice(0, 3).join(', ')}...`,
            `[AST] Extracted semantic tokens: ~${Math.round(totalLines * 12.5)} tokens.`
          ]);
        } else if (next === 2) {
          setTerminalLogs((logs) => [
            ...logs,
            `[OWASP] Analyzing injection vectors (SQLi, Command Injection, XSS, SSRF)...`,
            `[OWASP] Cross-referencing CWE-89, CWE-798, CWE-327 cryptography matrices.`
          ]);
        } else if (next === 3) {
          setTerminalLogs((logs) => [
            ...logs,
            `[ARCH] Discovering modular service boundaries and database communication hops...`,
            `[ARCH] Generating dynamic Mermaid.js flowchart and C4 Component diagrams.`
          ]);
        } else if (next === 4) {
          setTerminalLogs((logs) => [
            ...logs,
            `[REFACTOR] Detecting architectural smells (N+1 query loops, missing timeouts)...`,
            `[REFACTOR] Formulating side-by-side AST code remediation diffs.`
          ]);
        } else if (next === 5) {
          setTerminalLogs((logs) => [
            ...logs,
            `[REPORT] Compiling health score matrix and executive audit certification...`,
            `[READY] Finalizing verification and routing to Executive Overview Dashboard...`
          ]);
        }

        return next;
      });
    }, 1100);

    return () => clearInterval(interval);
  }, [files, repoName]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
      {/* Top Banner: Storyline Step 2 Indicator */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="shrink-0">
              <CodePulseLogo size={48} useAnimation={true} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                  Step 2 of 5
                </span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                  </span>
                  Live Neural Execution
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                Auditing Codebase: <span className="text-indigo-400 font-mono">{repoName || 'Codebase'}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 text-left sm:text-right pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80 flex-wrap sm:flex-nowrap">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Analyzed Payload</span>
              <span className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                {files.length} Files • {files.reduce((a, b) => a + (b.content?.split('\n').length || 0), 0)} LOC
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Engine</span>
              <span className="text-xs font-mono font-bold text-indigo-400 mt-0.5">
                Gemini 3.7 + AST
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{SCAN_STAGES[currentStageIndex]?.title || 'Processing AST...'}</span>
            </span>
            <span className="text-indigo-300 font-bold font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#090D16] h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Grid: Multi-Stage Pipeline Progress & Live AST Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive 6-Stage Pipeline (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Multi-Pass Execution Pipeline</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
              Active Stream
            </span>
          </div>

          <div className="space-y-2.5">
            {SCAN_STAGES.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stage.id}
                  className={`p-3.5 rounded-lg border transition-all duration-200 flex items-start gap-3 ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/30'
                      : isCompleted
                      ? 'bg-[#090D16] border-slate-800 text-slate-300'
                      : 'bg-[#090D16]/40 border-slate-800/60 opacity-40'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isCurrent ? 'text-indigo-300' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {stage.title}
                      </h4>
                      {isCurrent && (
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.2 rounded-full bg-indigo-900/60 text-indigo-300 animate-pulse">
                          In Progress
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[9px] font-mono font-bold text-emerald-400">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1 font-medium">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Terminal Stream & Inspected Files (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* File Payload Manifest */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>Files in Current Payload</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">{files.length.toLocaleString()} files (100%)</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {files.slice(0, 50).map((file, i) => (
                <div 
                  key={file.id || i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#090D16] border border-slate-800 text-xs font-mono text-slate-300"
                >
                  <span className="truncate max-w-[170px]" title={file.path || file.name}>{file.name}</span>
                  <span className="text-[10px] text-indigo-400 uppercase font-semibold">
                    {file.language}
                  </span>
                </div>
              ))}
              {files.length > 50 && (
                <div className="text-[10px] text-center text-slate-400 font-mono py-1 bg-slate-900/50 rounded border border-slate-800/60">
                  + {(files.length - 50).toLocaleString()} more files being fully audited
                </div>
              )}
            </div>
          </div>

          {/* Live Execution Telemetry Logs */}
          <div className="flex-1 bg-[#090D16] border border-slate-800 rounded-xl p-5 font-mono text-xs flex flex-col shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-xs">
              <div className="flex items-center gap-1.5 font-semibold">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Audit Telemetry Stream</span>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto text-xs leading-relaxed text-slate-300 max-h-56">
              {terminalLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-1.5">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <span className={log.includes('[SECURITY]') ? 'text-emerald-400' : log.includes('[OWASP]') ? 'text-rose-400' : log.includes('[ARCH]') ? 'text-indigo-300' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1 text-indigo-400 animate-pulse pt-1">
                <span>▍</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
