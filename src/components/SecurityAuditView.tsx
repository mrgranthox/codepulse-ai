import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Check, 
  Copy, 
  Search, 
  Filter, 
  FileCode2, 
  Terminal, 
  ExternalLink,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { SecurityFinding, Severity, ActiveTab } from '../types';
import { StorylineFooter } from './StorylineFooter';

interface SecurityAuditViewProps {
  findings: SecurityFinding[];
  onNavigate?: (tab: ActiveTab) => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({ findings, onNavigate }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtering
  const filteredFindings = findings.filter((item) => {
    const matchesSeverity =
      selectedSeverity === 'All' || item.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.owaspCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.filePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.cwe && item.cwe.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30';
      case 'medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'low':
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <AlertOctagon className="w-4 h-4 text-rose-400" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Security & OWASP Top 10 Vulnerability Audit
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pinpoint CWE vectors, line-level code exploits, and enterprise remediation blueprints
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center space-x-1 p-1 bg-[#020617] border border-slate-800 rounded-lg overflow-x-auto no-scrollbar">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => {
            const count =
              sev === 'All'
                ? findings.length
                : findings.filter((f) => f.severity.toLowerCase() === sev.toLowerCase()).length;

            return (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  selectedSeverity === sev
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{sev}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedSeverity === sev ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vulnerabilities by title, OWASP category, CWE, or file path..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Vulnerabilities List */}
      {filteredFindings.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Security Vulnerabilities Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No findings match your search filter.'
              : 'The audited codebase passed the OWASP security compliance checks.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFindings.map((finding) => {
            const isExpanded = expandedIds[finding.id] ?? true;

            return (
              <div
                key={finding.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-xl transition-all"
              >
                {/* Finding Header Bar */}
                <div className="p-4 sm:p-5 bg-[#020617] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="mt-0.5 sm:mt-0">{getSeverityIcon(finding.severity)}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          [{finding.id}]
                        </span>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {finding.title}
                        </h3>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getSeverityBadge(finding.severity)}`}>
                          {finding.severity}
                        </span>
                        {finding.cwe && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {finding.cwe}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-400 font-medium mt-1">
                        {finding.owaspCategory}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                      {finding.filePath}:{finding.lineStart}-{finding.lineEnd}
                    </span>
                  </div>
                </div>

                {/* Finding Body Details */}
                <div className="p-5 space-y-5">
                  {/* Description & Impact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-[#020617] border border-slate-800 rounded-lg space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Vulnerability Mechanism
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {finding.description}
                      </p>
                    </div>

                    <div className="p-3.5 bg-rose-950/20 border border-rose-900/30 rounded-lg space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300 block">
                        Adversary Impact & Exploitation Risk
                      </span>
                      <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
                        {finding.impact}
                      </p>
                    </div>
                  </div>

                  {/* Vulnerable Code Block */}
                  {finding.vulnerableCode && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          Vulnerable Code Location
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          Lines {finding.lineStart} - {finding.lineEnd}
                        </span>
                      </div>
                      <div className="p-3 bg-rose-950/10 border border-rose-900/40 rounded-lg font-mono text-xs text-rose-200 overflow-x-auto selection:bg-rose-500/30">
                        <pre className="whitespace-pre">{finding.vulnerableCode}</pre>
                      </div>
                    </div>
                  )}

                  {/* Remediation Steps Checklist */}
                  {finding.remediationSteps && finding.remediationSteps.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-200 block">
                        Step-by-Step Remediation Plan:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {finding.remediationSteps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#020617] border border-slate-800 text-xs text-slate-300 font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Production Remediation Code Block */}
                  {finding.remediationCode && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Recommended Production Hardening
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(finding.id, finding.remediationCode)}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                        >
                          {copiedId === finding.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copiedId === finding.id ? 'Copied' : 'Copy Remediation'}
                        </button>
                      </div>
                      <div className="p-3 bg-emerald-950/15 border border-emerald-800/40 rounded-lg font-mono text-xs text-emerald-200 overflow-x-auto selection:bg-emerald-500/30">
                        <pre className="whitespace-pre">{finding.remediationCode}</pre>
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
          currentTab="security"
          onNavigate={onNavigate}
          prevTab="architecture"
          prevLabel="← Back to Architecture Visualizer"
          nextTab="refactoring"
          nextLabel="Review Code Refactorings (Step 6) →"
        />
      )}
    </div>
  );
};
