import React from 'react';
import { X, BookOpen, Layers, ShieldCheck, Database, GitBranch, Cpu } from 'lucide-react';

interface C4SpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const C4SpecModal: React.FC<C4SpecModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#020617] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                CodePulse AI: Enterprise Architecture & System Engineering Spec
              </h2>
              <p className="text-[11px] text-slate-400">
                Document Status: APPROVED FOR IMPLEMENTATION • Level 4 Developer Infrastructure
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              1. Executive Summary & Vision Statement
            </h3>
            <p className="text-slate-400">
              Legacy static analysis tools (e.g. SonarQube, Fortify) analyze code line-by-line via rigid rule sets, missing macro-level architecture anti-patterns, distributed state failures, and multi-service security leaks. CodePulse AI treats entire codebases as unified semantic graphs powered by Google AI Studio Gemini models, executing multi-pass audits in under 30 seconds.
            </p>
          </div>

          {/* Section 2: Core Engineering Principles */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              2. Core Architectural Foundations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-[#020617] border border-slate-800 rounded-lg space-y-1">
                <span className="font-bold text-slate-200 block">Zero-Trust Ingestion</span>
                <p className="text-slate-400 text-[11px]">
                  Credentials, RSA private keys, and .env files are stripped client-side via WebAssembly parsers before leaving local memory.
                </p>
              </div>
              <div className="p-3 bg-[#020617] border border-slate-800 rounded-lg space-y-1">
                <span className="font-bold text-slate-200 block">AST Distillation & Map-Reduce</span>
                <p className="text-slate-400 text-[11px]">
                  Extracts structural skeletons, function signatures, and route decorators to reduce payload by up to 85% for multi-million line codebases.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: C4 Framework */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              3. C4 Level 1 & Level 2 Container Architecture
            </h3>
            <div className="p-4 bg-[#020617] border border-slate-800 rounded-lg font-mono text-[11px] text-indigo-200 overflow-x-auto">
              <pre>{`[Developers / VCS (GitHub/GitLab)]
               │
               ▼  (HTTPS / TLS 1.3)
[Ingress & Security Gateway (Kong/Envoy Mesh)]
               │
   ┌───────────┴──────────────────────────────┐
   ▼                                          ▼
[WASM AST Extractor & Secret Stripper]   [Temporal.io Orchestrator]
   │                                          │
   └───────────┬──────────────────────────────┘
               ▼
[Multi-Model AI Router (Gemini 2.5 Flash / Pro)]
               │
               ▼
[Mermaid.js Vector Renderer & PostgreSQL Database]`}</pre>
            </div>
          </div>

          {/* Section 4: PostgreSQL Schema */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              4. PostgreSQL Data Schema (DDL)
            </h3>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
              <pre>{`-- Audit Execution Runs
CREATE TABLE audit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  overall_health_score INT CHECK (overall_health_score BETWEEN 0 AND 100),
  security_score INT CHECK (security_score BETWEEN 0 AND 100),
  maintainability_score INT CHECK (maintainability_score BETWEEN 0 AND 100),
  status VARCHAR(50) DEFAULT 'IN_PROGRESS',
  execution_time_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`}</pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-slate-950/90 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Close Specification
          </button>
        </div>
      </div>
    </div>
  );
};
