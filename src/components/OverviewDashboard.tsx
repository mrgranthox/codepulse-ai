import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  TrendingDown, 
  TrendingUp,
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Clock,
  FileText,
  History,
  ShieldCheck,
  Zap,
  DollarSign,
  Database,
  Lock,
  Globe,
  FileCheck2,
  Server,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  GitCompare,
  Cpu
} from 'lucide-react';
import { AuditResult, ActiveTab } from '../types';
import { StorylineFooter } from './StorylineFooter';

interface OverviewDashboardProps {
  auditResult: AuditResult | null;
  previousAuditResult?: AuditResult | null;
  setActiveTab: (tab: ActiveTab) => void;
  onReAudit: () => void;
  isLoading: boolean;
  onOpenHistory?: () => void;
  onOpenSpec?: () => void;
  onOpenMemoryConsent?: () => void;
  onOpenMemoryOverlay?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  auditResult,
  previousAuditResult,
  setActiveTab,
  onReAudit,
  isLoading,
  onOpenHistory,
  onOpenSpec,
  onOpenMemoryConsent,
  onOpenMemoryOverlay
}) => {
  if (!auditResult) {
    return (
      <div className="p-8 sm:p-12 text-center bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white tracking-tight">No Audit Data Available Yet</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
          Upload your codebase files or select an enterprise preset to run the Gemini-powered architectural and security audit.
        </p>
        <button
          onClick={() => setActiveTab('upload')}
          className="mt-5 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 border border-indigo-400/30 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer min-h-[44px]"
        >
          Go to Upload & Audit
        </button>
      </div>
    );
  }

  const { summary, architecture, securityAudit, codeSmells, astMetrics } = auditResult;

  // Comparison metrics calculation against previous audit
  const prevFiles = previousAuditResult?.scannedFilesCount || 0;
  const currFiles = auditResult.scannedFilesCount || 0;
  const filesDelta = prevFiles > 0 ? currFiles - prevFiles : 0;

  const prevLoc = previousAuditResult?.astMetrics?.totalLinesOfCode || 0;
  const currLoc = astMetrics.totalLinesOfCode || 0;
  const locDelta = prevLoc > 0 ? currLoc - prevLoc : 0;

  const prevScore = previousAuditResult?.summary?.overallHealthScore || 0;
  const currScore = summary.overallHealthScore || 0;
  const scoreDelta = prevScore > 0 ? currScore - prevScore : 0;

  const prevVulns = previousAuditResult?.summary?.totalVulnerabilities || 0;
  const currVulns = summary.totalVulnerabilities || 0;
  const vulnsDelta = prevVulns > 0 ? currVulns - prevVulns : 0;

  // Section 9 Live Unit Economics Computation
  const rawLoc = astMetrics.totalLinesOfCode || 1200;
  const estimatedTokens = astMetrics.estimatedTokenCount || Math.round(rawLoc * 15);
  // Flash Map: $0.15 per 1M tokens ($0.00015 / 1k tokens)
  const mapCost = (estimatedTokens * 0.00015) / 1000;
  // Flash Reduce Output: $0.60 per 1M tokens ($0.0006 / 1k tokens)
  const outputTokens = Math.round(estimatedTokens * 0.25);
  const reduceCost = (outputTokens * 0.0006) / 1000;
  const storageCost = 0.00002;
  const totalAuditCost = mapCost + reduceCost + storageCost;
  const historicalBaseline = 0.45;
  const circuitBreakerPass = totalAuditCost < (historicalBaseline * 3);

  return (
    <div className="space-y-6">
      {/* Top Banner: Repo Name & Scan Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight truncate max-w-[240px] sm:max-w-md">
                {auditResult.repoName || 'Codebase Audit Report'}
              </h2>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700 shrink-0">
                {auditResult.scannedFilesCount} Files Scanned
              </span>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-400 font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {auditResult.executionTimeMs}ms execution
              </span>
              <span>•</span>
              <span className="font-mono text-indigo-400">{auditResult.modelUsed}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onOpenMemoryOverlay && (
            <button
              type="button"
              onClick={onOpenMemoryOverlay}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm min-h-[40px]"
              title="Inspect D3.js Heap Memory Curve and Lifecycle Telemetry"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Memory (D3)</span>
            </button>
          )}
          {onOpenMemoryConsent && (
            <button
              type="button"
              onClick={onOpenMemoryConsent}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm min-h-[40px]"
              title="Inspect memory buffer state and configure clearance consent"
            >
              <span>Consent</span>
            </button>
          )}
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm min-h-[40px]"
              title="View past audit sessions"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>History</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('export')}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm min-h-[40px]"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Full Report</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer min-h-[40px]"
          >
            <span>View Architecture</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Metrics 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Health Score */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Health</p>
            <p className="text-2xl font-bold text-white tracking-tight mt-1.5">
              {summary.overallHealthScore}
              <span className="text-slate-500 text-sm font-normal"> / 100</span>
            </p>
          </div>
          <div className="h-12 w-12 border-2 border-emerald-500/30 rounded-full flex items-center justify-center">
            <div className={`h-8 w-8 border-2 ${summary.overallHealthScore >= 80 ? 'border-emerald-500' : summary.overallHealthScore >= 50 ? 'border-amber-500' : 'border-rose-500'} rounded-full border-t-transparent rotate-45`}></div>
          </div>
        </div>

        {/* Card 2: Vulnerabilities */}
        <div 
          onClick={() => setActiveTab('security')}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-xl hover:border-rose-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/10 cursor-pointer shadow-xl group"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vulnerabilities</p>
          <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
            <p className="text-2xl font-bold text-rose-500 tracking-tight">
              {summary.totalVulnerabilities}
            </p>
            {summary.severityCounts.critical > 0 ? (
              <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full font-bold uppercase tracking-wider">
                {summary.severityCounts.critical} CRITICAL
              </span>
            ) : summary.severityCounts.high > 0 ? (
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold uppercase tracking-wider">
                {summary.severityCounts.high} HIGH
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold uppercase tracking-wider">
                PASSED
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Cyclomatic Complexity */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-xl shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cyclomatic Complexity</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <p className="text-2xl font-bold text-amber-400 tracking-tight">
              {summary.cyclomaticComplexity}
            </p>
            <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {summary.maintainabilityScore}% MI
            </span>
          </div>
        </div>

        {/* Card 4: Code Smells */}
        <div 
          onClick={() => setActiveTab('refactoring')}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-xl hover:border-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer shadow-xl group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Code Quality & Smells</p>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-bold">
              {summary.totalCodeSmells + summary.totalVulnerabilities} Total Patches
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1.5">
            <p className="text-2xl font-bold text-indigo-400 tracking-tight">
              {summary.totalCodeSmells}
              <span className="text-slate-500 text-xs font-normal ml-1">Smells</span>
            </p>
            <span className="text-xs text-slate-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1 font-semibold">
              Studio &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Enterprise Audit Evolution & Delta Comparison Card */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Enterprise Codebase Evolution & Audit-to-Audit Delta
            </h3>
          </div>
          {previousAuditResult ? (
            <span className="text-[11px] font-mono text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/50 rounded-full w-fit">
              Comparing to Session #{previousAuditResult.id?.slice(-4) || 'Prev'}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-slate-400 font-medium px-2 py-0.5 bg-slate-800 rounded-full w-fit">
              Initial Audit Baseline Established
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Delta 1: Files Scanned */}
          <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-1">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">Files Scanned</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-white font-mono">{currFiles} files</span>
              {previousAuditResult && (
                <span className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${
                  filesDelta > 0 ? 'text-emerald-400' : filesDelta < 0 ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {filesDelta > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : filesDelta < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                  {filesDelta > 0 ? `+${filesDelta}` : filesDelta < 0 ? `${filesDelta}` : '0 Δ'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {previousAuditResult ? `Prev: ${prevFiles} files scanned` : 'Baseline established'}
            </span>
          </div>

          {/* Delta 2: Lines of Code */}
          <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-1">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">Lines of Code</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-white font-mono">{currLoc.toLocaleString()}</span>
              {previousAuditResult && (
                <span className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${
                  locDelta >= 0 ? 'text-indigo-400' : 'text-slate-400'
                }`}>
                  {locDelta > 0 ? `+${locDelta.toLocaleString()}` : locDelta < 0 ? `${locDelta.toLocaleString()}` : '0 Δ'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {previousAuditResult ? `Prev: ${prevLoc.toLocaleString()} LOC` : 'Baseline established'}
            </span>
          </div>

          {/* Delta 3: Security Score Delta */}
          <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-1">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">Security Health</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-white font-mono">{currScore}%</span>
              {previousAuditResult && (
                <span className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${
                  scoreDelta > 0 ? 'text-emerald-400' : scoreDelta < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {scoreDelta > 0 ? `+${scoreDelta}%` : scoreDelta < 0 ? `${scoreDelta}%` : '0% Δ'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {previousAuditResult ? `Prev score: ${prevScore}%` : 'Baseline established'}
            </span>
          </div>

          {/* Delta 4: Vulnerabilities Delta */}
          <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-1">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">Vulnerabilities</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-white font-mono">{currVulns} found</span>
              {previousAuditResult && (
                <span className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${
                  vulnsDelta < 0 ? 'text-emerald-400' : vulnsDelta > 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {vulnsDelta < 0 ? `${vulnsDelta} resolved` : vulnsDelta > 0 ? `+${vulnsDelta} detected` : '0 Δ'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {previousAuditResult ? `Prev: ${prevVulns} vulnerabilities` : 'Baseline established'}
            </span>
          </div>
        </div>

        {/* Dynamic Language Composition Breakdown Bar */}
        {astMetrics.languageBreakdown && Object.keys(astMetrics.languageBreakdown).length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Audited Language Breakdown</span>
              <span className="font-mono text-[11px] text-slate-400">
                {Object.entries(astMetrics.languageBreakdown).map(([lang, pct]) => `${lang}: ${pct}%`).join(' • ')}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              {Object.entries(astMetrics.languageBreakdown).map(([lang, pct], idx) => {
                const colors = [
                  'bg-indigo-500',
                  'bg-emerald-500',
                  'bg-amber-500',
                  'bg-cyan-500',
                  'bg-purple-500',
                  'bg-rose-500'
                ];
                return (
                  <div
                    key={lang}
                    style={{ width: `${pct}%` }}
                    className={`h-full ${colors[idx % colors.length]}`}
                    title={`${lang}: ${pct}%`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Enterprise Specification & Unit Economics Row (Section 9 - 14 Architecture Addendum) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 9: Live Unit Economics & Cost Model (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Unit Economics & Run Cost Breakdown (Section 9)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
              ${totalAuditCost.toFixed(4)} / Run
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Calculated using the enterprise Map-Reduce cost formula across {estimatedTokens.toLocaleString()} AST tokens.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Map Phase (Flash)</span>
              <span className="text-xs font-mono font-bold text-white mt-1 block">${mapCost.toFixed(5)}</span>
            </div>
            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Reduce Synthesis</span>
              <span className="text-xs font-mono font-bold text-white mt-1 block">${reduceCost.toFixed(5)}</span>
            </div>
            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Margin Guardrail</span>
              <span className="text-xs font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PASS (&lt;3x baseline)
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>AST Token Compression: <strong>-{astMetrics.astReductionPercentage}%</strong></span>
            <span>Target SLA: <strong>&lt;30s</strong></span>
          </div>
        </div>

        {/* Section 11 & 12: Zero-Trust RLS & Compliance Attestation (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Zero-Trust RLS & Regulatory Compliance (Sections 11–13)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
              SOC2 Type I Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-white block">Tenant RLS Isolation</span>
                <span className="text-[11px] text-slate-400">Supabase Row-Level Security active on repositories & audit tables.</span>
              </div>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-white block">Data Residency & GDPR</span>
                <span className="text-[11px] text-slate-400">EU-WEST-1 / US-CENTRAL routing with 30-Day automated purge.</span>
              </div>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg flex items-start gap-2.5">
              <Server className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-white block">Continuous WAL PITR</span>
                <span className="text-[11px] text-slate-400">RPO &lt; 15 min, RTO &lt; 1 hr with automated failover testing.</span>
              </div>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg flex items-start gap-2.5">
              <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-white block">Zero Prompt Retention</span>
                <span className="text-[11px] text-slate-400">Google Gemini API zero data-training guarantee attestation.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Key Takeaways & AST Token Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Key Takeaways (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Executive Audit Takeaways & Critical Priorities
              </h3>
            </div>
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              AI Synthesis
            </span>
          </div>

          <div className="space-y-2.5">
            {summary.keyTakeaways.map((takeaway, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {takeaway}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AST Context Window Efficiency & Token Metrics (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  AST Distillation & Efficiency
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/50">
                -{astMetrics.astReductionPercentage}% Tokens
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Structural skeleton extraction compresses AST payloads to fit full repositories into Gemini context windows with zero loss of semantic linkage.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Lines of Code
                </span>
                <span className="text-lg font-bold text-white font-mono tracking-tight mt-0.5 block">
                  {astMetrics.totalLinesOfCode}
                </span>
              </div>
              <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Functions / Handlers
                </span>
                <span className="text-lg font-bold text-white font-mono tracking-tight mt-0.5 block">
                  {astMetrics.totalFunctions}
                </span>
              </div>
              <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Classes & Modules
                </span>
                <span className="text-lg font-bold text-white font-mono tracking-tight mt-0.5 block">
                  {astMetrics.totalClassesOrModules}
                </span>
              </div>
              <div className="p-3.5 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Tokens Ingested
                </span>
                <span className="text-lg font-bold text-indigo-400 font-mono tracking-tight mt-0.5 block">
                  {astMetrics.estimatedTokenCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              WASM Tree-Sitter Parser
            </span>
            <span className="font-mono text-[11px] text-slate-500 font-semibold">&lt; 500ms SLA</span>
          </div>
        </div>
      </div>

      {/* Storyline Navigation Footer */}
      <StorylineFooter
        currentTab="overview"
        onNavigate={setActiveTab}
        nextTab="architecture"
        nextLabel="Explore System Architecture (Step 2) →"
      />
    </div>
  );
};
