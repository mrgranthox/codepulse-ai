import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Check, 
  Copy, 
  Search, 
  FileCode2, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { SecurityFinding, ActiveTab } from '../types';
import { StorylineFooter } from './StorylineFooter';
import { PaginationControls } from './PaginationControls';

interface SecurityAuditViewProps {
  findings: SecurityFinding[];
  onNavigate?: (tab: ActiveTab) => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({ findings, onNavigate }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedOwasp, setSelectedOwasp] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean>(true);

  // Pagination states
  const [pageSize, setPageSize] = useState<number | 'All'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSeverity, selectedOwasp, searchQuery, pageSize]);

  // Extract unique OWASP categories with counts
  const owaspCategories = useMemo(() => {
    const map = new Map<string, number>();
    findings.forEach((f) => {
      const cat = f.owaspCategory || 'Other';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  }, [findings]);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle individual card expansion
  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const current = prev[id] !== undefined ? prev[id] : allExpanded;
      return { ...prev, [id]: !current };
    });
  };

  // Toggle all cards
  const handleToggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newMap: Record<string, boolean> = {};
    findings.forEach((f) => {
      newMap[f.id] = nextState;
    });
    setExpandedCards(newMap);
  };

  // Export all findings to JSON report
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(findings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `security-audit-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtering
  const filteredFindings = useMemo(() => {
    return findings.filter((item) => {
      const matchesSeverity =
        selectedSeverity === 'All' || item.severity.toLowerCase() === selectedSeverity.toLowerCase();
      
      const matchesOwasp =
        selectedOwasp === 'All' || item.owaspCategory.toLowerCase() === selectedOwasp.toLowerCase();

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.owaspCategory.toLowerCase().includes(q) ||
        item.filePath.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.cwe && item.cwe.toLowerCase().includes(q));

      return matchesSeverity && matchesOwasp && matchesSearch;
    });
  }, [findings, selectedSeverity, selectedOwasp, searchQuery]);

  // Total pages calculation
  const totalPages = useMemo(() => {
    if (pageSize === 'All') return 1;
    return Math.max(1, Math.ceil(filteredFindings.length / pageSize));
  }, [filteredFindings.length, pageSize]);

  // Paginated items
  const paginatedFindings = useMemo(() => {
    if (pageSize === 'All') return filteredFindings;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredFindings.slice(startIndex, startIndex + pageSize);
  }, [filteredFindings, currentPage, pageSize]);

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
        return <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Filters */}
      <div className="flex flex-col gap-4 p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Security & OWASP Top 10 Vulnerability Audit
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
                {findings.length} Total Findings Listed
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Exhaustive analysis across OWASP Top 10, CWE flaw categories, and enterprise hardening remediations
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={handleToggleAll}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer min-h-[44px]"
            >
              {allExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-indigo-500/40 transition-colors cursor-pointer min-h-[44px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit ({findings.length})</span>
            </button>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          {/* Severity Filter Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg overflow-x-auto no-scrollbar">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => {
              const count =
                sev === 'All'
                  ? findings.length
                  : findings.filter((f) => f.severity.toLowerCase() === sev.toLowerCase()).length;

              return (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-3 py-2 rounded-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer min-h-[40px] ${
                    selectedSeverity === sev
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{sev}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    selectedSeverity === sev ? 'bg-indigo-950 text-indigo-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* OWASP Category Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedOwasp}
              onChange={(e) => setSelectedOwasp(e.target.value)}
              aria-label="Filter by OWASP Category"
              className="bg-[#0B0F17] border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 w-full md:w-auto min-h-[40px]"
            >
              <option value="All">All OWASP Categories ({findings.length})</option>
              {owaspCategories.map(({ category, count }) => (
                <option key={category} value={category}>
                  {category} ({count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search Bar & Result Counter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vulnerabilities by title, OWASP category, CWE, or file path..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors shadow-lg"
          />
        </div>

        <div className="text-xs text-slate-400 px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl shrink-0 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Listing <strong className="text-white">{filteredFindings.length}</strong> of <strong className="text-slate-300">{findings.length}</strong> findings
          </span>
        </div>
      </div>

      {/* Top Pagination Summary (Compact when multiple pages) */}
      {filteredFindings.length > 0 && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredFindings.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20, 50, 'All']}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="vulnerabilities"
          compact={true}
        />
      )}

      {/* Vulnerabilities List */}
      {filteredFindings.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white tracking-tight">No Security Vulnerabilities Match Filters</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery || selectedSeverity !== 'All' || selectedOwasp !== 'All'
              ? 'Try resetting the search or category filters to view all findings.'
              : 'The audited codebase passed the OWASP security compliance checks.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedFindings.map((finding) => {
            const isCardOpen = expandedCards[finding.id] !== undefined ? expandedCards[finding.id] : allExpanded;

            return (
              <div
                key={finding.id}
                className="bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-xl transition-all duration-200"
              >
                {/* Finding Header Bar */}
                <div 
                  onClick={() => toggleCard(finding.id)}
                  className="p-4 sm:p-5 bg-[#0B0F17] border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1">
                    <div className="mt-0.5 sm:mt-0">{getSeverityIcon(finding.severity)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          [{finding.id}]
                        </span>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {finding.title}
                        </h3>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${getSeverityBadge(finding.severity)}`}>
                          {finding.severity}
                        </span>
                        {finding.cwe && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {finding.cwe}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-400 font-semibold mt-1">
                        {finding.owaspCategory}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5 font-medium truncate max-w-[260px] sm:max-w-xs">
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{finding.filePath}:{finding.lineStart}-{finding.lineEnd}</span>
                    </span>
                    <button
                      type="button"
                      aria-label="Toggle details"
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                    >
                      {isCardOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Finding Body Details */}
                {isCardOpen && (
                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Description & Impact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-lg space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                          Vulnerability Mechanism
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                          {finding.description}
                        </p>
                      </div>

                      <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-lg space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-rose-300 block">
                          Adversary Impact & Exploitation Risk
                        </span>
                        <p className="text-sm text-rose-200/90 leading-relaxed font-medium">
                          {finding.impact}
                        </p>
                      </div>
                    </div>

                    {/* Vulnerable Code Block */}
                    {finding.vulnerableCode && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                            <AlertOctagon className="w-4 h-4" />
                            Vulnerable Code Location
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            Lines {finding.lineStart} - {finding.lineEnd}
                          </span>
                        </div>
                        <div className="p-4 bg-[#0B0F17] border border-rose-900/40 rounded-lg font-mono text-xs text-rose-200 overflow-x-auto selection:bg-rose-500/30">
                          <pre className="whitespace-pre">{finding.vulnerableCode}</pre>
                        </div>
                      </div>
                    )}

                    {/* Remediation Steps Checklist */}
                    {finding.remediationSteps && finding.remediationSteps.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                          Step-by-Step Remediation Plan:
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {finding.remediationSteps.map((step, sIdx) => (
                            <div
                              key={sIdx}
                              className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0B0F17] border border-slate-800 text-sm text-slate-300 font-medium"
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Recommended Production Hardening
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(finding.id, finding.remediationCode)}
                            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                          >
                            {copiedId === finding.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedId === finding.id ? 'Copied' : 'Copy Remediation'}
                          </button>
                        </div>
                        <div className="p-4 bg-[#0B0F17] border border-emerald-800/40 rounded-lg font-mono text-xs text-emerald-200 overflow-x-auto selection:bg-emerald-500/30">
                          <pre className="whitespace-pre">{finding.remediationCode}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Full Pagination Controls */}
      {filteredFindings.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredFindings.length}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20, 50, 'All']}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="vulnerabilities"
        />
      )}

      {/* Storyline Navigation Footer */}
      {onNavigate && (
        <StorylineFooter
          currentTab="security"
          onNavigate={onNavigate}
          prevTab="architecture"
          prevLabel="← Back to System Architecture (Step 2)"
          nextTab="refactoring"
          nextLabel="Review Code Refactorings (Step 4) →"
        />
      )}
    </div>
  );
};

