import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Code2 } from 'lucide-react';

interface MermaidRendererProps {
  chart: string;
  id?: string;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart, id = 'mermaid-graph' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isRawView, setIsRawView] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      themeVariables: {
        darkMode: true,
        background: '#090d16',
        primaryColor: '#4f46e5',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#6366f1',
        lineColor: '#818cf8',
        secondaryColor: '#1e1b4b',
        tertiaryColor: '#0f172a'
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!chart || !chart.trim()) {
        setSvgContent('');
        setRenderError(null);
        return;
      }

      setRenderError(null);
      const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

      try {
        // Clean chart string from any markdown wrappers
        let cleanChart = chart.replace(/```mermaid/gi, '').replace(/```/g, '').trim();
        
        // Basic fallback if empty
        if (!cleanChart) {
          cleanChart = 'graph TD\n  Start[Codebase Loaded] --> Scan[Security Audit]';
        }

        const { svg } = await mermaid.render(uniqueId, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          setRenderError(err.message || 'Failed to render Mermaid diagram syntax.');
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Visualizer Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Dynamic Architecture Flow Graph
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            Mermaid.js v11
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsRawView(!isRawView)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              isRawView
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle Raw Mermaid Script"
          >
            <Code2 className="w-3.5 h-3.5" />
            {isRawView ? 'Visual View' : 'Raw Script'}
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="ml-2 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Copy Mermaid Syntax"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Diagram Canvas or Raw Code */}
      <div className="relative flex-1 min-h-[420px] overflow-auto p-6 flex items-center justify-center bg-radial from-slate-900/50 to-slate-950">
        {isRawView ? (
          <div className="w-full h-full p-4">
            <pre className="w-full h-full p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-indigo-200 overflow-auto selection:bg-indigo-500/40">
              {chart}
            </pre>
          </div>
        ) : renderError ? (
          <div className="max-w-md p-6 bg-rose-950/30 border border-rose-800/40 rounded-xl text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-rose-300">Mermaid Rendering Fallback</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{renderError}</p>
            <div className="p-3 bg-slate-900 rounded text-left font-mono text-xs text-slate-300 overflow-x-auto max-h-40">
              {chart}
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
            className="w-full flex justify-center items-center select-none"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
};
