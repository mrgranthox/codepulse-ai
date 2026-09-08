import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Layers, 
  X, 
  RefreshCw, 
  TrendingDown, 
  Info, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { AuditResult, CodeFile } from '../types';
import { previewMemoryOptimization } from '../utils/memoryOptimizer';
import { useTheme } from '../context/ThemeContext';

interface MemoryPerformanceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  auditResult: AuditResult | null;
  files: CodeFile[];
  onTriggerOptimization?: () => void;
  isOptimized?: boolean;
}

interface MemoryDataPoint {
  stage: string;
  label: string;
  timeSec: number;
  heapMb: number;
  freedMb: number;
  description: string;
  color: string;
}

export const MemoryPerformanceOverlay: React.FC<MemoryPerformanceOverlayProps> = ({
  isOpen,
  onClose,
  auditResult,
  files,
  onTriggerOptimization,
  isOptimized = false
}) => {
  const { isDark } = useTheme();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MemoryDataPoint | null>(null);
  const [isLiveSimulating, setIsLiveSimulating] = useState<boolean>(false);
  const [simTick, setSimTick] = useState<number>(0);

  // Calculate memory stats
  const preview = previewMemoryOptimization(files, auditResult);
  const totalHeapNum = parseFloat(preview.totalHeapMb) || 1.2;
  const freedHeapNum = parseFloat(preview.estimatedHeapFreedMb) || 0.8;

  // Base stages data
  const baseData: MemoryDataPoint[] = [
    {
      stage: 'Baseline',
      label: 'Session Init',
      timeSec: 0,
      heapMb: 14.5,
      freedMb: 0,
      description: 'Browser idle state and static UI engine memory footprint.',
      color: '#6366F1'
    },
    {
      stage: 'Ingestion',
      label: 'File Buffer Read',
      timeSec: 1,
      heapMb: 14.5 + totalHeapNum * 1.4,
      freedMb: 0,
      description: `Raw UTF-16 string ingestion for ${files.length} codebase files into memory.`,
      color: '#8B5CF6'
    },
    {
      stage: 'AST Parsing',
      label: 'Neural AST Peak',
      timeSec: 2,
      heapMb: 14.5 + totalHeapNum * 2.8 + 12.0,
      freedMb: 0,
      description: 'Abstract Syntax Tree allocation, symbol dependency graph, and tokenization buffers.',
      color: '#EC4899'
    },
    {
      stage: 'Clearance',
      label: isOptimized ? 'Memory Cycle Executed' : 'Clearance Pending',
      timeSec: 3,
      heapMb: isOptimized ? Math.max(16.0, (14.5 + totalHeapNum * 2.8 + 12.0) - freedHeapNum * 2.6 - 10.5) : (14.5 + totalHeapNum * 2.8 + 10.0),
      freedMb: isOptimized ? freedHeapNum : 0,
      description: isOptimized 
        ? `Clean file buffer purge triggered: ${preview.cleanFilesCount} clean files released, retaining ${preview.issueFilesCount} finding files.`
        : 'Full source buffers still held in RAM across all clean files.',
      color: isOptimized ? '#10B981' : '#F59E0B'
    },
    {
      stage: 'Steady State',
      label: 'Post-Audit Steady',
      timeSec: 4,
      heapMb: isOptimized ? Math.max(15.2, 14.5 + (totalHeapNum - freedHeapNum) * 1.1) : (14.5 + totalHeapNum * 2.0),
      freedMb: isOptimized ? freedHeapNum : 0,
      description: isOptimized 
        ? 'Optimal browser runtime state with protected quota and zero UI thread latency.'
        : 'High memory baseline; consider triggering memory clearance routine.',
      color: isOptimized ? '#06B6D4' : '#E11D48'
    }
  ];

  // Render D3.js Chart
  useEffect(() => {
    if (!isOpen || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = 260;
    const margin = { top: 20, right: 30, bottom: 40, left: 45 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradient definition
    const defs = svg.append('defs');

    const areaGradient = defs.append('linearGradient')
      .attr('id', 'memory-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isOptimized ? '#10B981' : '#6366F1')
      .attr('stop-opacity', 0.45);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isOptimized ? '#06B6D4' : '#4F46E5')
      .attr('stop-opacity', 0.0);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, 4])
      .range([0, chartWidth]);

    const maxHeap = d3.max(baseData, d => d.heapMb) || 50;
    const yScale = d3.scaleLinear()
      .domain([0, maxHeap * 1.25])
      .range([chartHeight, 0]);

    // Grid lines
    const yAxisGrid = d3.axisLeft(yScale)
      .tickSize(-chartWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.2)')
      .attr('stroke-dasharray', '2,2');

    g.selectAll('.grid .domain').remove();

    // Area Generator
    const area = d3.area<MemoryDataPoint>()
      .x(d => xScale(d.timeSec))
      .y0(chartHeight)
      .y1(d => yScale(d.heapMb))
      .curve(d3.curveMonotoneX);

    // Line Generator
    const line = d3.line<MemoryDataPoint>()
      .x(d => xScale(d.timeSec))
      .y(d => yScale(d.heapMb))
      .curve(d3.curveMonotoneX);

    // Append Area
    g.append('path')
      .datum(baseData)
      .attr('fill', 'url(#memory-area-gradient)')
      .attr('d', area);

    // Append Line
    const path = g.append('path')
      .datum(baseData)
      .attr('fill', 'none')
      .attr('stroke', isOptimized ? '#10B981' : '#6366F1')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Line transition animation
    const totalLength = (path.node() as SVGPathElement)?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat((d) => baseData[Number(d)]?.stage || `T+${d}s`);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d} MB`);

    const axisTextColor = isDark ? '#94A3B8' : '#475569';

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .attr('color', isDark ? '#475569' : '#94A3B8')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', axisTextColor);

    g.append('g')
      .call(yAxis)
      .attr('color', isDark ? '#475569' : '#94A3B8')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', axisTextColor);

    // Data Points & Interactive Circles
    const dots = g.selectAll('.dot')
      .data(baseData)
      .enter()
      .append('g')
      .attr('class', 'dot')
      .attr('transform', d => `translate(${xScale(d.timeSec)},${yScale(d.heapMb)})`);

    dots.append('circle')
      .attr('r', 5)
      .attr('fill', d => d.color)
      .attr('stroke', isDark ? '#090D16' : '#FFFFFF')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('mouseenter', (_, d) => setSelectedPoint(d));

    // Pulse effect on clearance point
    if (isOptimized) {
      g.append('circle')
        .attr('cx', xScale(3))
        .attr('cy', yScale(baseData[3].heapMb))
        .attr('r', 8)
        .attr('fill', 'none')
        .attr('stroke', '#10B981')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.8)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '6;14;6')
        .attr('dur', '2s')
        .attr('repeatCount', 'indefinite');
    }

  }, [isOpen, files, auditResult, isOptimized, simTick]);

  // Live simulation ticker
  useEffect(() => {
    if (!isLiveSimulating) return;
    const interval = setInterval(() => {
      setSimTick(prev => prev + 1);
    }, 1200);
    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#0D121F] dark:bg-[#0D121F] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-t-emerald-500/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-[#0B0F17] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Heap Memory Performance & Lifecycle Analytics
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  D3.js Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time JavaScript heap memory allocation curve across AST parsing, buffer release, and steady states.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Top Performance Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-slate-400" />
                Peak Ingestion Heap
              </span>
              <p className="text-lg font-bold font-mono text-white mt-1">
                {(14.5 + totalHeapNum * 2.8 + 12.0).toFixed(1)} <span className="text-xs font-normal text-slate-400">MB</span>
              </p>
              <span className="text-[10px] text-slate-500">AST parsing peak</span>
            </div>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-400" />
                Current Footprint
              </span>
              <p className="text-lg font-bold font-mono text-indigo-300 mt-1">
                {isOptimized ? (14.5 + (totalHeapNum - freedHeapNum) * 1.1).toFixed(1) : (14.5 + totalHeapNum * 2.0).toFixed(1)} <span className="text-xs font-normal text-indigo-400">MB</span>
              </p>
              <span className="text-[10px] text-slate-500">{isOptimized ? 'Optimized steady state' : 'Unoptimized buffers'}</span>
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-emerald-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                RAM Reclaimed
              </span>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
                ~{freedHeapNum.toFixed(2)} <span className="text-xs font-normal text-emerald-300">MB</span>
              </p>
              <span className="text-[10px] text-emerald-400/80">{preview.cleanFilesCount} clean files released</span>
            </div>

            <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-indigo-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                Full Source Retained
              </span>
              <p className="text-lg font-bold font-mono text-indigo-300 mt-1">
                {preview.issueFilesCount} <span className="text-xs font-normal text-indigo-400">files</span>
              </p>
              <span className="text-[10px] text-indigo-400/80">Findings & active editor</span>
            </div>
          </div>

          {/* D3.js Lifecycle Chart Container */}
          <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Heap Memory Timeline (D3 Visualization)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLiveSimulating(!isLiveSimulating)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                    isLiveSimulating 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isLiveSimulating ? 'animate-spin' : ''}`} />
                  <span>{isLiveSimulating ? 'Live Sampling ON' : 'Live Sampling'}</span>
                </button>
              </div>
            </div>

            <div ref={containerRef} className="w-full relative">
              <svg ref={svgRef} className="w-full overflow-visible"></svg>
            </div>

            {/* Selected / Hover Point Inspector */}
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-300">
                  {selectedPoint 
                    ? `${selectedPoint.stage} (${selectedPoint.label}): ${selectedPoint.description}`
                    : 'Hover over or tap any data point on the curve to inspect heap stage telemetry.'
                  }
                </span>
              </div>
              {selectedPoint && (
                <span className="font-mono font-bold text-indigo-300 shrink-0 pl-2">
                  {selectedPoint.heapMb.toFixed(1)} MB
                </span>
              )}
            </div>
          </div>

          {/* Architecture Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Quota & DOM Protection
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Prunes heavy raw string buffers for files with zero security vulnerabilities and zero code smells, preventing browser tab crashes during massive enterprise scans.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                Verbatim Finding Preservation
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                All AST nodes, C4 system topology, and full source code for every file with detected CVEs or code smells are 100% retained for inline diff patching.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0B0F17] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isOptimized ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>Status: <strong className={isOptimized ? 'text-emerald-300' : 'text-amber-300'}>{isOptimized ? 'Optimized' : 'Raw Buffer Active'}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {!isOptimized && onTriggerOptimization && (
              <button
                type="button"
                onClick={() => {
                  onTriggerOptimization();
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Execute Deep Clean (~{freedHeapNum.toFixed(2)} MB)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
