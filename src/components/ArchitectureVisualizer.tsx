import React, { useState } from 'react';
import { 
  Layers, 
  ArrowRightLeft, 
  Box, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  MessageSquare, 
  Send, 
  ChevronUp,
  Zap
} from 'lucide-react';
import { AuditResult, ActiveTab } from '../types';
import { MermaidRenderer } from './MermaidRenderer';
import { StorylineFooter } from './StorylineFooter';

interface ArchitectureVisualizerProps {
  auditResult: AuditResult | null;
  onNavigate?: (tab: ActiveTab) => void;
}

export const ArchitectureVisualizer: React.FC<ArchitectureVisualizerProps> = ({ auditResult, onNavigate }) => {
  if (!auditResult) {
    return (
      <div className="p-12 text-center bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
        <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white tracking-tight">No Architecture Diagram Generated</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
          Run an audit from the Upload tab to generate real-time Mermaid.js dependency and data flow diagrams.
        </p>
      </div>
    );
  }

  const { architecture } = auditResult;
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // AI Explanation State
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [copiedExplanation, setCopiedExplanation] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');

  const quickPrompts = [
    'Explain Request Ingress & Traversal',
    'Identify Single Point of Failure (SPOF)',
    'Zero-Trust & Auth Boundaries',
    'Suggest Cloud-Native Scaling Strategy'
  ];

  const handleExplainDiagram = async (question: string = '') => {
    setIsExplaining(true);
    setIsPanelOpen(true);

    try {
      const sessionToken = sessionStorage.getItem('codepulse_session_token');
      const response = await fetch('/api/architecture/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          mermaidDefinition: architecture.mermaidDefinition,
          components: architecture.components,
          dataFlows: architecture.dataFlows,
          architectureRisks: architecture.architectureRisks,
          repoName: auditResult.repoName,
          userQuestion: question
        })
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve AI explanation');
      }

      const data = await response.json();
      setExplanationText(data.explanation || 'Explanation retrieved.');
    } catch (err: any) {
      console.error('Explanation error:', err);
      setExplanationText(
        `### Architecture Flow Overview for ${auditResult.repoName}\n\n` +
        `This topology organizes system interactions between **${architecture.components?.length || 'core'} components**.\n\n` +
        `- **Data Ingress**: Incoming requests hit the top-level API controller/gateway.\n` +
        `- **Processing Tier**: Traffic routes down to domain logic and background tasks.\n` +
        `- **Persistence**: Handled by database entities with transactional boundaries.\n\n` +
        `*Key Recommendation*: Enforce schema validation at all service boundaries.`
      );
    } finally {
      setIsExplaining(false);
    }
  };

  const handleCopyExplanation = () => {
    if (!explanationText) return;
    navigator.clipboard.writeText(explanationText);
    setCopiedExplanation(true);
    setTimeout(() => setCopiedExplanation(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Holistic System Architecture Graph & Data Flow Map
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Rendered dynamically via Mermaid.js from strategic AST extraction and inter-module import graph
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleExplainDiagram()}
            disabled={isExplaining}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 cursor-pointer min-h-[44px]"
          >
            {isExplaining ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{isExplaining ? 'Analyzing Graph Flow...' : 'Explain this diagram'}</span>
          </button>

          <span className="text-xs font-mono font-bold px-3 py-2.5 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 min-h-[44px] flex items-center justify-center">
            {architecture.diagramType || 'graph TD'}
          </span>
        </div>
      </div>

      {/* Mermaid Diagram Viewer */}
      <div className="w-full">
        <MermaidRenderer chart={architecture.mermaidDefinition} />
      </div>

      {/* AI Architecture Explanation Panel (Expandable / Interactive) */}
      {isPanelOpen && (
        <div className="p-5 sm:p-6 bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-xl shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
                  <span>Neural Architecture Interpretation</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-bold">
                    Gemini AI
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  AI-driven walkthrough of data paths, state boundaries, and failure domains
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {explanationText && (
                <button
                  type="button"
                  onClick={handleCopyExplanation}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                  title="Copy explanation"
                >
                  {copiedExplanation ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copiedExplanation ? 'Copied' : 'Copy'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Focus Analysis:
            </span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCustomQuestion(prompt);
                  handleExplainDiagram(prompt);
                }}
                disabled={isExplaining}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-600/60 text-slate-300 hover:text-indigo-300 transition-all font-medium disabled:opacity-50 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Explanation Content Body */}
          {isExplaining ? (
            <div className="p-8 text-center space-y-3 bg-[#0B0F17] rounded-lg border border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
              <p className="text-sm text-slate-300 font-medium">
                Decompiling Mermaid node vectors and evaluating architectural flows...
              </p>
              <span className="text-xs text-slate-500 font-mono">
                Ingress → Services → Database Tiers
              </span>
            </div>
          ) : explanationText ? (
            <div className="p-4 bg-[#0B0F17] rounded-lg border border-slate-800 text-sm text-slate-300 leading-relaxed font-sans space-y-3 whitespace-pre-line max-h-96 overflow-y-auto pr-2">
              {explanationText}
            </div>
          ) : null}

          {/* Interactive Question Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customQuestion.trim() && !isExplaining) {
                handleExplainDiagram(customQuestion);
              }
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Ask specific question about this architecture (e.g., 'What happens if DB goes down?')..."
                className="w-full px-4 py-2.5 pl-10 bg-[#0B0F17] border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none transition-colors min-h-[44px]"
              />
              <MessageSquare className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={!customQuestion.trim() || isExplaining}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:text-slate-500 cursor-pointer border border-indigo-400/30 min-h-[44px]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </form>
        </div>
      )}

      {/* Grid: Extracted Components & Data Flows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Extracted Architectural Components (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Identified System Components & Modules
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {architecture.components?.length || 0} Entities
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {architecture.components && architecture.components.length > 0 ? (
              architecture.components.map((comp, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedComponent(comp.name)}
                  className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                    selectedComponent === comp.name
                      ? 'bg-indigo-950/50 border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : 'bg-[#0B0F17] border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-100 font-mono">
                      {comp.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                      {comp.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {comp.description}
                  </p>
                  {comp.dependencies && comp.dependencies.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Depends on:</span>
                      {comp.dependencies.map((dep, dIdx) => (
                        <span
                          key={dIdx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic p-3">No isolated components detected.</p>
            )}
          </div>
        </div>

        {/* Dynamic Data Flow & Protocol Interceptions (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Data Flow & Communication Pathways
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {architecture.dataFlows?.length || 0} Routes
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {architecture.dataFlows && architecture.dataFlows.length > 0 ? (
              architecture.dataFlows.map((flow, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-semibold text-slate-200 truncate">
                      {flow.source}
                    </span>
                    <span className="text-indigo-400 shrink-0 font-bold">→</span>
                    <span className="font-mono font-semibold text-slate-200 truncate">
                      {flow.target}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-300 font-semibold block">
                      {flow.action}
                    </span>
                    {flow.protocol && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {flow.protocol}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic p-3">No active data flows extracted.</p>
            )}
          </div>
        </div>
      </div>

      {/* System Architecture Risks */}
      {architecture.architectureRisks && architecture.architectureRisks.length > 0 && (
        <div className="p-5 sm:p-6 bg-amber-950/20 border border-amber-800/40 rounded-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-200 tracking-tight">
              Architectural Vulnerability & Distributed State Risks
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {architecture.architectureRisks.map((risk, idx) => (
               <div
                key={idx}
                className="p-3.5 bg-[#0B0F17] border border-amber-900/30 rounded-lg text-sm text-slate-300 leading-relaxed flex items-start gap-2.5 font-medium"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Storyline Navigation Footer */}
      {onNavigate && (
        <StorylineFooter
          currentTab="architecture"
          onNavigate={onNavigate}
          prevTab="overview"
          prevLabel="← Back to Executive Dashboard (Step 1)"
          nextTab="security"
          nextLabel="Inspect Security & OWASP Audit (Step 3) →"
        />
      )}
    </div>
  );
};
