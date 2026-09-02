import React, { useState } from 'react';
import { 
  Layers, 
  ArrowRightLeft, 
  AlertTriangle, 
  Box, 
  Cpu, 
  Network, 
  Check, 
  Copy, 
  ExternalLink,
  ShieldAlert
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
      <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
        <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Architecture Diagram Generated</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Run an audit from the Upload tab to generate real-time Mermaid.js dependency and data flow diagrams.
        </p>
      </div>
    );
  }

  const { architecture } = auditResult;
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Holistic System Architecture Graph & Data Flow Map
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rendered dynamically via Mermaid.js from Gemini neural AST parsing and multi-service linkage detection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
            {architecture.diagramType || 'graph TD'}
          </span>
        </div>
      </div>

      {/* Mermaid Diagram Viewer */}
      <div className="w-full">
        <MermaidRenderer chart={architecture.mermaidDefinition} />
      </div>

      {/* Grid: Extracted Components & Data Flows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Extracted Architectural Components (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Identified System Components & Modules
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {architecture.components?.length || 0} Entities
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {architecture.components && architecture.components.length > 0 ? (
              architecture.components.map((comp, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedComponent(comp.name)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    selectedComponent === comp.name
                      ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-[#020617] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-100 font-mono">
                      {comp.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {comp.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {comp.description}
                  </p>
                  {comp.dependencies && comp.dependencies.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-semibold">Depends on:</span>
                      {comp.dependencies.map((dep, dIdx) => (
                        <span
                          key={dIdx}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-3">No isolated components detected.</p>
            )}
          </div>
        </div>

        {/* Dynamic Data Flow & Protocol Interceptions (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Data Flow & Communication Pathways
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {architecture.dataFlows?.length || 0} Routes
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {architecture.dataFlows && architecture.dataFlows.length > 0 ? (
              architecture.dataFlows.map((flow, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#020617] border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-semibold text-slate-200 truncate">
                      {flow.source}
                    </span>
                    <span className="text-indigo-400 shrink-0">→</span>
                    <span className="font-mono font-semibold text-slate-200 truncate">
                      {flow.target}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-300 font-medium block">
                      {flow.action}
                    </span>
                    {flow.protocol && (
                      <span className="text-[10px] font-mono text-slate-500">
                        {flow.protocol}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-3">No active data flows extracted.</p>
            )}
          </div>
        </div>
      </div>

      {/* System Architecture Risks */}
      {architecture.architectureRisks && architecture.architectureRisks.length > 0 && (
        <div className="p-5 bg-amber-950/20 border border-amber-800/40 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-200">
              Architectural Vulnerability & Distributed State Risks
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {architecture.architectureRisks.map((risk, idx) => (
               <div
                key={idx}
                className="p-3 bg-slate-950/80 border border-amber-900/30 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
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
          prevLabel="← Back to Overview Dashboard"
          nextTab="security"
          nextLabel="Inspect Security & OWASP Audit (Step 5) →"
        />
      )}
    </div>
  );
};
