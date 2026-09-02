import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Printer, 
  Check, 
  Copy, 
  ShieldCheck, 
  Layers, 
  AlertOctagon, 
  Sparkles,
  Award,
  Calendar,
  Clock,
  Cpu
} from 'lucide-react';
import { AuditResult, ActiveTab } from '../types';
import { StorylineFooter } from './StorylineFooter';

interface ExportReportViewProps {
  auditResult: AuditResult | null;
  onNavigate?: (tab: ActiveTab) => void;
}

export const ExportReportView: React.FC<ExportReportViewProps> = ({ auditResult, onNavigate }) => {
  const [copiedMd, setCopiedMd] = useState(false);

  if (!auditResult) {
    return (
      <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Audit Report to Export</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Please run an audit first to generate downloadable and printable compliance reports.
        </p>
      </div>
    );
  }

  const { summary, securityAudit, codeSmells, architecture, astMetrics } = auditResult;

  // Generate Markdown text for export
  const generateMarkdownReport = () => {
    return `# CodePulse AI - Enterprise Codebase & Security Audit Report
**Target Codebase:** ${auditResult.repoName || 'Audited Repository'}
**Audit Date:** ${new Date(auditResult.timestamp).toLocaleString()}
**Engine:** ${auditResult.modelUsed}
**Health Score:** ${summary.overallHealthScore}/100
**Cyclomatic Complexity:** ${summary.cyclomaticComplexity}

---

## 1. Executive Summary
- **Total Security Findings:** ${summary.totalVulnerabilities} (Critical: ${summary.severityCounts.critical}, High: ${summary.severityCounts.high}, Medium: ${summary.severityCounts.medium}, Low: ${summary.severityCounts.low})
- **Total Code Debt / Smells:** ${summary.totalCodeSmells}
- **Maintainability Index:** ${summary.maintainabilityScore}%
- **AST Reduction Efficiency:** ${astMetrics.astReductionPercentage}%

### Key Takeaways:
${summary.keyTakeaways.map((k) => `- ${k}`).join('\n')}

---

## 2. Architecture & Linkage Overview
\`\`\`mermaid
${architecture.mermaidDefinition}
\`\`\`

### Architectural Risks:
${architecture.architectureRisks.map((r) => `- ${r}`).join('\n')}

---

## 3. Security & OWASP Top 10 Findings
${securityAudit.map((sec, idx) => `
### [${sec.id}] ${sec.title}
- **Severity:** ${sec.severity}
- **OWASP Category:** ${sec.owaspCategory}
- **File Location:** \`${sec.filePath}:${sec.lineStart}-${sec.lineEnd}\`
- **CWE:** ${sec.cwe || 'N/A'}

#### Vulnerability Description:
${sec.description}

#### Adversary Impact:
${sec.impact}

#### Vulnerable Code:
\`\`\`
${sec.vulnerableCode}
\`\`\`

#### Production Remediation:
\`\`\`
${sec.remediationCode}
\`\`\`
`).join('\n\n')}

---

## 4. Code Smells & Refactoring Plan
${codeSmells.map((smell) => `
### [${smell.id}] ${smell.title}
- **Category:** ${smell.category}
- **Severity:** ${smell.severity}
- **Location:** \`${smell.filePath}:${smell.lineStart}-${smell.lineEnd}\`

#### Explanation:
${smell.explanation}

#### Refactored Code:
\`\`\`
${smell.refactoredCode}
\`\`\`
`).join('\n\n')}

---
*Report certified by CodePulse AI Level 4 Developer Infrastructure.*
`;
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `codepulse-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadMarkdown = () => {
    const mdContent = generateMarkdownReport();
    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CODEPULSE_AUDIT_REPORT.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Executive Audit Certification & Export Hub
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Export machine-readable JSON artifacts, human-friendly Markdown, or print-ready PDF audit binders
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>JSON Artifact</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Markdown (.md)</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
          >
            {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMd ? 'Copied MD' : 'Copy MD'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Formal Audit Certificate Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Certificate Watermark Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-800/40">
              AUDIT CERTIFICATION SPECIFICATION
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-2 tracking-tight">
              {auditResult.repoName || 'Target Codebase'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Automated Zero-Trust Multi-Pass Architectural, OWASP, and Code Smells Assessment
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 font-mono text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Run ID:</span> <span className="text-white">{auditResult.id}</span>
            </div>
            <div>
              <span className="text-slate-500">Timestamp:</span>{' '}
              <span className="text-slate-300">{new Date(auditResult.timestamp).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500">Engine:</span>{' '}
              <span className="text-indigo-400 font-semibold">{auditResult.modelUsed}</span>
            </div>
          </div>
        </div>

        {/* Executive Score Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-[#020617] border border-slate-800 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Overall Health
            </span>
            <span className={`text-2xl sm:text-3xl font-extrabold mt-1 block ${
              summary.overallHealthScore >= 80 ? 'text-emerald-400' : summary.overallHealthScore >= 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {summary.overallHealthScore}/100
            </span>
          </div>

          <div className="p-4 bg-[#020617] border border-slate-800 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Complexity
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">
              {summary.cyclomaticComplexity}
            </span>
          </div>

          <div className="p-4 bg-[#020617] border border-slate-800 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Vulnerabilities
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1 block">
              {summary.totalVulnerabilities}
            </span>
          </div>

          <div className="p-4 bg-[#020617] border border-slate-800 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Refactorings
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-1 block">
              {summary.totalCodeSmells}
            </span>
          </div>
        </div>

        {/* Compliance Checklist Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Compliance & Zero-Trust Governance Verification
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-[#020617] border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Prompt Data Retention</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Code payloads processed under enterprise SLAs with zero model training retention.
              </p>
            </div>

            <div className="p-3.5 bg-[#020617] border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Client-Side Secret Redaction</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Pre-flight regex filters scrub RSA certificates, passwords, and private API keys.
              </p>
            </div>

            <div className="p-3.5 bg-[#020617] border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                <Layers className="w-4 h-4" />
                <span>SOC2 Type II Readiness</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Structured machine audit artifacts ready for SIEM ingestion and security audits.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Storyline Navigation Footer */}
      {onNavigate && (
        <StorylineFooter
          currentTab="export"
          onNavigate={onNavigate}
          prevTab="refactoring"
          prevLabel="← Back to Refactorings"
          nextTab="upload"
          nextLabel="Audit Another Codebase / Repository →"
        />
      )}
    </div>
  );
};
