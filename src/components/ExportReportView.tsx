import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Printer, 
  Check, 
  Copy, 
  ShieldCheck, 
  Layers, 
  Award,
  Archive,
  RefreshCw,
  FolderArchive,
  FileCode
} from 'lucide-react';
import JSZip from 'jszip';
import { AuditResult, ActiveTab } from '../types';
import { StorylineFooter } from './StorylineFooter';
import { sanitizeMermaidChart } from './MermaidRenderer';

interface ExportReportViewProps {
  auditResult: AuditResult | null;
  onNavigate?: (tab: ActiveTab) => void;
}

export const ExportReportView: React.FC<ExportReportViewProps> = ({ auditResult, onNavigate }) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  if (!auditResult) {
    return (
      <div className="p-12 text-center bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white tracking-tight">No Audit Report to Export</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
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
${sanitizeMermaidChart(architecture.mermaidDefinition)}
\`\`\`

### Architectural Risks:
${architecture.architectureRisks.map((r) => `- ${r}`).join('\n')}

---

## 3. Security & OWASP Top 10 Findings
${securityAudit.map((sec) => `
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

  // Structured ZIP Archive Generator (Individual JSON and Markdown per finding)
  const handleDownloadStructuredZip = async () => {
    setIsZipping(true);
    setZipSuccess(false);

    try {
      const zip = new JSZip();
      const safeRepoSlug = (auditResult.repoName || 'codebase').replace(/[^a-zA-Z0-9_\-]/g, '_');

      // 1. Root Master Files
      zip.file('README.md', generateMarkdownReport());
      zip.file('audit-summary.json', JSON.stringify(auditResult, null, 2));

      // 2. Architecture Folder
      const archFolder = zip.folder('architecture');
      if (archFolder) {
        archFolder.file('architecture-diagram.mmd', sanitizeMermaidChart(architecture.mermaidDefinition));
        archFolder.file('components.json', JSON.stringify(architecture.components, null, 2));
        archFolder.file('data-flows.json', JSON.stringify(architecture.dataFlows, null, 2));
        archFolder.file(
          'risks.md',
          `# Architectural Vulnerability & Distributed State Risks\n\n` +
          architecture.architectureRisks.map((r, i) => `${i + 1}. ${r}`).join('\n')
        );
      }

      // 3. Security Findings Folder (Individual Markdown and JSON per finding)
      const secFolder = zip.folder('security-findings');
      if (secFolder) {
        secFolder.file('index.json', JSON.stringify(securityAudit, null, 2));
        
        securityAudit.forEach((sec, idx) => {
          const titleSlug = (sec.title || `vulnerability-${idx + 1}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 40);
          const baseName = `${sec.id || `SEC-${idx + 1}`}_${titleSlug}`;

          const individualMd = `# [${sec.id}] ${sec.title}
- **Severity:** ${sec.severity}
- **OWASP Category:** ${sec.owaspCategory}
- **Target File:** \`${sec.filePath}\` (Lines ${sec.lineStart}-${sec.lineEnd})
- **CWE Identification:** ${sec.cwe || 'N/A'}

---

## 1. Technical Vulnerability Description
${sec.description}

## 2. Threat Vector & Adversary Impact
${sec.impact}

## 3. Vulnerable Source Code Snippet
\`\`\`
${sec.vulnerableCode}
\`\`\`

## 4. Production-Ready Remediation Code
\`\`\`
${sec.remediationCode}
\`\`\`

## 5. Step-by-Step Remediation Action Plan
${sec.remediationSteps.map((step, sIdx) => `${sIdx + 1}. ${step}`).join('\n')}

---
*Generated by CodePulse AI Zero-Trust Auditor*
`;
          secFolder.file(`${baseName}.md`, individualMd);
          secFolder.file(`${baseName}.json`, JSON.stringify(sec, null, 2));
        });
      }

      // 4. Refactoring Proposals Folder (Individual Markdown and JSON per code smell)
      const refactorFolder = zip.folder('refactoring-proposals');
      if (refactorFolder) {
        refactorFolder.file('index.json', JSON.stringify(codeSmells, null, 2));

        codeSmells.forEach((smell, idx) => {
          const titleSlug = (smell.title || `smell-${idx + 1}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 40);
          const baseName = `${smell.id || `SMELL-${idx + 1}`}_${titleSlug}`;

          const individualMd = `# [${smell.id}] ${smell.title}
- **Category:** ${smell.category}
- **Severity:** ${smell.severity}
- **Location:** \`${smell.filePath}\` (Lines ${smell.lineStart}-${smell.lineEnd})

---

## 1. Code Smell Explanation & Bottleneck Analysis
${smell.explanation}

## 2. Original Problematic Code
\`\`\`
${smell.snippet}
\`\`\`

## 3. Recommended Clean Refactored Code
\`\`\`
${smell.refactoredCode}
\`\`\`

## 4. Tangible Engineering Benefits
${smell.benefits.map((b) => `- ${b}`).join('\n')}

---
*Generated by CodePulse AI Strategic Refactoring Engine*
`;
          refactorFolder.file(`${baseName}.md`, individualMd);
          refactorFolder.file(`${baseName}.json`, JSON.stringify(smell, null, 2));
        });
      }

      // 5. AST & Telemetry Metrics Folder
      const astFolder = zip.folder('ast-telemetry');
      if (astFolder) {
        astFolder.file('metrics.json', JSON.stringify(astMetrics, null, 2));
      }

      // Generate the ZIP blob
      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = downloadUrl;
      downloadAnchor.download = `${safeRepoSlug}_codepulse_audit_bundle.zip`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(downloadUrl);

      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create structured ZIP file:', err);
    } finally {
      setIsZipping(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Executive Audit Certification & Export Hub
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Export structured ZIP artifact archives with individual JSON/MD findings, single Markdown summaries, or print-ready binders
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Structured ZIP Export (Primary Action) */}
          <button
            type="button"
            onClick={handleDownloadStructuredZip}
            disabled={isZipping}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-emerald-950/40 active:scale-95 disabled:opacity-60 cursor-pointer min-h-[44px]"
          >
            {isZipping ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : zipSuccess ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <FolderArchive className="w-4 h-4 text-emerald-200" />
            )}
            <span>{isZipping ? 'Bundling ZIP...' : zipSuccess ? 'Downloaded ZIP!' : 'Structured ZIP (.zip)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm min-h-[44px]"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>JSON Artifact</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm min-h-[44px]"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Markdown (.md)</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-sm min-h-[44px]"
          >
            {copiedMd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
            <span>{copiedMd ? 'Copied MD' : 'Copy MD'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-indigo-600/25 border border-indigo-400/30 active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Structured ZIP Package Contents Banner */}
      <div className="p-5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
          <Archive className="w-4 h-4 text-emerald-400" />
          <span>Structured ZIP Package Specification</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          The <strong>Structured ZIP (.zip)</strong> bundle compiles separate sub-directories with individual Markdown reports and JSON payloads for every detected security finding (<span className="text-rose-400 font-mono font-bold">{securityAudit.length} files</span>), code smell (<span className="text-indigo-400 font-mono font-bold">{codeSmells.length} files</span>), raw Mermaid architecture diagrams, and AST metrics ready for automated CI/CD and SIEM ingestion.
        </p>
      </div>

      {/* Formal Audit Certificate Card */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Certificate Watermark Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/40">
              AUDIT CERTIFICATION SPECIFICATION
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-2.5 tracking-tight">
              {auditResult.repoName || 'Target Codebase'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Automated Zero-Trust Multi-Pass Architectural, OWASP, and Code Smells Assessment
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 font-mono text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Run ID:</span> <span className="text-white font-bold">{auditResult.id}</span>
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
          <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Overall Health
            </span>
            <span className={`text-2xl sm:text-3xl font-bold mt-1 block tracking-tight tabular-nums ${
              summary.overallHealthScore >= 80 ? 'text-emerald-400' : summary.overallHealthScore >= 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {summary.overallHealthScore}/100
            </span>
          </div>

          <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Complexity
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block tracking-tight tabular-nums">
              {summary.cyclomaticComplexity}
            </span>
          </div>

          <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Vulnerabilities
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-rose-400 mt-1 block tracking-tight tabular-nums">
              {summary.totalVulnerabilities}
            </span>
          </div>

          <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Refactorings
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-indigo-400 mt-1 block tracking-tight tabular-nums">
              {summary.totalCodeSmells}
            </span>
          </div>
        </div>

        {/* Compliance Checklist Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Compliance & Zero-Trust Governance Verification
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Prompt Data Retention</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Code payloads processed under enterprise SLAs with zero model training retention.
              </p>
            </div>

            <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Client-Side Secret Redaction</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Pre-flight regex filters scrub RSA certificates, passwords, and private API keys.
              </p>
            </div>

            <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                <Layers className="w-4 h-4" />
                <span>SOC2 Type II Readiness</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
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
          prevLabel="← Back to Code Refactorings (Step 4)"
          nextTab="overview"
          nextLabel="Return to Executive Dashboard (Step 1) →"
        />
      )}
    </div>
  );
};
