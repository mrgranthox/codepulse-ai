/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ArchitectureVisualizer } from './components/ArchitectureVisualizer';
import { SecurityAuditView } from './components/SecurityAuditView';
import { RefactoringView } from './components/RefactoringView';
import { ExportReportView } from './components/ExportReportView';
import { ExecutionScanner } from './components/ExecutionScanner';
import { StorylineStepper } from './components/StorylineStepper';
import { AuditHistoryDrawer } from './components/AuditHistoryDrawer';
import { EnterpriseGovernanceModals, GovernanceModalTab } from './components/EnterpriseGovernanceModals';
import { ClearanceConsentModal } from './components/ClearanceConsentModal';
import { SettingsModal, FrameworkPreferences } from './components/SettingsModal';
import { MemoryPerformanceOverlay } from './components/MemoryPerformanceOverlay';
import { C4SpecModal } from './components/C4SpecModal';
import { EnterpriseFooter } from './components/EnterpriseFooter';
import { ThemeProvider } from './context/ThemeContext';
import { ActiveTab, CodeFile, AuditResult, AuditHistoryItem } from './types';
import { AlertCircle, CheckCircle2, History, Cpu, Sparkles, ShieldCheck, Lock } from 'lucide-react';
import { optimizeFileMemory, previewMemoryOptimization, MemoryOptimizationPreview } from './utils/memoryOptimizer';

const STORAGE_KEY = 'codepulse_audit_history_v2';
const MEMORY_PREF_KEY = 'codepulse_memory_pref_v1';

function AppContent() {
  // Always greet user with the clean Upload & Ingestion page first
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload');
  const [repoName, setRepoName] = useState<string>('');
  const [customRules, setCustomRules] = useState<string>('');
  
  // Clean initial state (no hardcoded demo files)
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [previousAuditResult, setPreviousAuditResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState<boolean>(false);
  const [governanceTab, setGovernanceTab] = useState<GovernanceModalTab>('about');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isC4SpecOpen, setIsC4SpecOpen] = useState<boolean>(false);
  const [isMemoryOverlayOpen, setIsMemoryOverlayOpen] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [isMemoryOptimized, setIsMemoryOptimized] = useState<boolean>(false);
  const [sessionToken, setSessionToken] = useState<string>(() => sessionStorage.getItem('codepulse_session_token') || '');
  const auditAbortRef = useRef<AbortController | null>(null);

  const handleCancelAudit = () => {
    if (auditAbortRef.current) {
      auditAbortRef.current.abort();
      auditAbortRef.current = null;
    }
    setIsLoading(false);
    setActiveTab('upload');
    setSuccessToast('Audit scan cancelled by user.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const [frameworkPreferences, setFrameworkPreferences] = useState<FrameworkPreferences>(() => {
    try {
      const saved = localStorage.getItem('codepulse_framework_prefs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse framework preferences from localStorage:', e);
    }
    return {
      owaspEnabled: true,
      cweEnabled: true,
      soc2Enabled: true
    };
  });

  useEffect(() => {
    async function initSessionAuth() {
      try {
        const res = await fetch('/api/auth/session', { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            setSessionToken(data.token);
            sessionStorage.setItem('codepulse_session_token', data.token);
          }
        }
      } catch (e) {
        console.warn('Session initialization fallback to local tenant auth', e);
      }
    }
    initSessionAuth();
  }, []);

  const handleOpenGovernance = (tab?: GovernanceModalTab) => {
    setGovernanceTab(tab || 'about');
    setIsGovernanceOpen(true);
  };

  // Deep-Memory Clearance Consent Modal state
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState<boolean>(false);
  const [memoryPreview, setMemoryPreview] = useState<MemoryOptimizationPreview | null>(null);
  const [pendingRawFiles, setPendingRawFiles] = useState<CodeFile[] | null>(null);
  const [pendingAuditData, setPendingAuditData] = useState<AuditResult | null>(null);

  // Local Storage Audit History (Only real stored sessions, no mock seed)
  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse audit history from localStorage:', e);
    }
    return [];
  });

  // Persist history to localStorage
  const saveAuditToHistory = (newResult: AuditResult, scannedFiles: CodeFile[]) => {
    const historyItem: AuditHistoryItem = {
      id: newResult.id || `audit-${Date.now()}`,
      timestamp: newResult.timestamp || new Date().toISOString(),
      repoName: newResult.repoName || 'Audited Codebase',
      overallScore: newResult.summary.overallHealthScore,
      criticalCount: newResult.summary.severityCounts.critical,
      vulnerabilitiesCount: newResult.summary.totalVulnerabilities,
      codeSmellsCount: newResult.summary.totalCodeSmells,
      filesCount: newResult.scannedFilesCount || scannedFiles.length,
      modelUsed: newResult.modelUsed || 'Gemini 3.7 Flash',
      files: scannedFiles,
      auditResult: newResult
    };

    setAuditHistory((prev) => {
      const filtered = prev.filter(item => item.id !== historyItem.id);
      const updated = [historyItem, ...filtered].slice(0, 20);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage quota or serialization error:', e);
      }
      return updated;
    });

    setCurrentSessionId(historyItem.id);
  };

  const handleLoadSession = (session: AuditHistoryItem) => {
    // Look up preceding audit in history to provide comparison baseline
    const sessionIndex = auditHistory.findIndex((item) => item.id === session.id);
    if (sessionIndex !== -1 && sessionIndex < auditHistory.length - 1) {
      setPreviousAuditResult(auditHistory[sessionIndex + 1].auditResult);
    } else {
      setPreviousAuditResult(null);
    }

    setAuditResult(session.auditResult);
    setRepoName(session.repoName);
    if (session.files && session.files.length > 0) {
      setFiles(session.files);
      setActiveFileIndex(0);
    }
    setCurrentSessionId(session.id);
    setActiveTab('overview');
    setSuccessToast(`Loaded cached report for "${session.repoName}" (${session.overallScore}% Health)`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleDeleteSession = (sessionId: string) => {
    setAuditHistory((prev) => {
      const updated = prev.filter((item) => item.id !== sessionId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (currentSessionId === sessionId) {
      setCurrentSessionId(undefined);
    }
  };

  const handleClearAllHistory = () => {
    setAuditHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setCurrentSessionId(undefined);
    setSuccessToast('All audit history cleared.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Helper to trigger deep-memory clearance consent dialog manually
  const handleOpenMemoryConsent = () => {
    const preview = previewMemoryOptimization(files, auditResult);
    setMemoryPreview(preview);
    setPendingRawFiles(files);
    setPendingAuditData(auditResult);
    setIsClearanceModalOpen(true);
  };

  // Confirm memory optimization routine - retains 100% of files in background
  const handleConfirmOptimize = () => {
    const rawFilesToClean = pendingRawFiles || files;
    const currentAudit = pendingAuditData || auditResult;
    const optResult = optimizeFileMemory(rawFilesToClean, currentAudit);
    
    setFiles(optResult.optimizedFiles);
    setIsMemoryOptimized(true);
    setIsClearanceModalOpen(false);
    setPendingRawFiles(null);
    setPendingAuditData(null);

    setSuccessToast(`Background memory optimization active: 100% of files (${optResult.retainedFilesCount}) retained in local memory.`);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  // User decides to retain 100% full source in client memory
  const handleRetainFullSource = () => {
    if (pendingRawFiles) {
      setFiles(pendingRawFiles);
    }
    setIsClearanceModalOpen(false);
    setPendingRawFiles(null);
    setPendingAuditData(null);

    setSuccessToast(`All files retained: 100% full source preserved in background.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Triggered when user initiates audit from UploadSection
  const handleRunAudit = async () => {
    if (files.length === 0) {
      setErrorMessage('Please upload or paste at least one source file before running an audit.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setActiveTab('execution'); // Jump to live Storyline Stepper execution view

    // If an audit already exists, store it as the previous comparison baseline
    if (auditResult) {
      setPreviousAuditResult(auditResult);
      // Clear the current auditResult so the UI immediately reflects the new files being scanned
      setAuditResult(null);
    }

    const abortCtrl = new AbortController();
    auditAbortRef.current = abortCtrl;
    const timeoutTimer = setTimeout(() => {
      abortCtrl.abort(new Error('Audit timed out after 3 minutes'));
    }, 180000);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
        },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          files,
          repoName: repoName || 'Custom Codebase',
          customRules,
          activeFrameworks: frameworkPreferences
        }),
      });

      clearTimeout(timeoutTimer);
      auditAbortRef.current = null;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const auditData: AuditResult = await response.json();
      setAuditResult(auditData);

      // Evaluate memory footprint - retain 100% of files as background activity
      const preview = previewMemoryOptimization(files, auditData);
      setMemoryPreview(preview);
      saveAuditToHistory(auditData, files);

      setTimeout(() => {
        setIsLoading(false);
        setActiveTab('overview');
        setSuccessToast(`Audit complete! All source files retained locally (${auditData.scannedFilesCount || files.length} files, background memory telemetry active).`);
        setTimeout(() => setSuccessToast(null), 4500);
      }, 800);
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      auditAbortRef.current = null;
      console.error('Audit execution error:', err);
      setIsLoading(false);
      setActiveTab('upload');

      if (abortCtrl.signal.aborted) {
        if (err?.message?.includes('timed out')) {
          setErrorMessage('Codebase audit timed out while analyzing files. For large codebases, consider auditing critical subdirectories or modules.');
        }
        return;
      }

      setErrorMessage(err?.message || 'Failed to complete codebase audit.');
    }
  };

  // GitHub direct fetch & audit
  const handleFetchAndAuditGithub = async (repoUrl: string, maxFiles: number = 0) => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveTab('execution');

    if (auditResult) {
      setPreviousAuditResult(auditResult);
      // Clear the current auditResult so the UI immediately reflects the new incoming repo scan
      setAuditResult(null);
    }

    try {
      const response = await fetch('/api/github-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
        },
        signal: AbortSignal.timeout(180000), // 3-minute timeout for GitHub ingestion & full audit pipeline
        body: JSON.stringify({
          repoUrl,
          maxFiles,
          customRules
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `GitHub import failed with status ${response.status}`);
      }

      const repoData = await response.json();
      const currentRepoTitle = repoData.repoName || repoUrl.split('/').slice(-2).join('/');
      setRepoName(currentRepoTitle);

      const auditData: AuditResult = repoData.auditResult;
      setAuditResult(auditData);

      // Evaluate memory footprint - retain 100% of files as background activity
      const preview = previewMemoryOptimization(repoData.files, auditData);
      setMemoryPreview(preview);
      setFiles(repoData.files);
      saveAuditToHistory(auditData, repoData.files);

      setTimeout(() => {
        setIsLoading(false);
        setActiveTab('overview');
        setSuccessToast(`Successfully imported & audited "${currentRepoTitle}" (100% full source retained in memory, background telemetry active).`);
        setTimeout(() => setSuccessToast(null), 4500);
      }, 800);
    } catch (err: any) {
      console.error('GitHub ingestion error:', err);
      setIsLoading(false);
      setActiveTab('upload');
      const isTimeout =
        err?.name === 'TimeoutError' ||
        err?.name === 'AbortError' ||
        err?.message?.toLowerCase().includes('timed out') ||
        err?.message?.toLowerCase().includes('aborted');

      const message = isTimeout
        ? 'GitHub ingestion & audit timed out. The repository may be exceptionally large or GitHub rate limits may be active. Try setting max files to 20-50 or upload files directly.'
        : err?.message || 'Failed to import and audit GitHub repository.';

      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] dark:bg-[#090D16] light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-800 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        auditResult={auditResult}
        isLoading={isLoading}
        onRunAudit={handleRunAudit}
        onNewAudit={() => setActiveTab('upload')}
        hasFiles={files.length > 0}
        filesCount={files.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={auditHistory.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMemory={() => setIsMemoryOverlayOpen(true)}
        onOpenC4Spec={() => setIsC4SpecOpen(true)}
      />

      {/* Toast Notifications */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-rose-950/90 border border-rose-500/40 text-rose-200 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          {files.length > 0 && (
            <button
              onClick={() => {
                setErrorMessage(null);
                handleRunAudit();
              }}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
        {/* Storyline Stepper Navigation (Only shown in Extended Workspace) */}
        {activeTab !== 'upload' && activeTab !== 'execution' && (
          <StorylineStepper
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            auditResult={auditResult}
            isLoading={isLoading}
            onReAudit={handleRunAudit}
          />
        )}

        {/* View Router */}
        {activeTab === 'upload' && (
          <UploadSection
            files={files}
            setFiles={setFiles}
            activeFileIndex={activeFileIndex}
            setActiveFileIndex={setActiveFileIndex}
            onRunAudit={handleRunAudit}
            onFetchAndAuditGithub={handleFetchAndAuditGithub}
            isLoading={isLoading}
            repoName={repoName}
            setRepoName={setRepoName}
            customRules={customRules}
            setCustomRules={setCustomRules}
            auditResult={auditResult}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'execution' && (
          <ExecutionScanner
            files={files}
            repoName={repoName}
            isAuditComplete={!isLoading && auditResult !== null}
            auditResult={auditResult}
            onCancel={handleCancelAudit}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewDashboard
            auditResult={auditResult}
            previousAuditResult={previousAuditResult}
            setActiveTab={setActiveTab}
            onReAudit={handleRunAudit}
            isLoading={isLoading}
            currentFilesCount={files.length}
            currentRepoName={repoName}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenGovernance={handleOpenGovernance}
            onOpenMemoryConsent={handleOpenMemoryConsent}
            onOpenMemoryOverlay={() => setIsMemoryOverlayOpen(true)}
            isMemoryOptimized={isMemoryOptimized}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureVisualizer 
            auditResult={auditResult} 
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'security' && (
          <SecurityAuditView 
            findings={auditResult?.securityAudit || []} 
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'refactoring' && (
          <RefactoringView 
            smells={auditResult?.codeSmells || []} 
            securityFindings={auditResult?.securityAudit || []}
            files={files}
            auditResult={auditResult}
            onNavigate={setActiveTab}
            onReAudit={handleRunAudit}
            isLoading={isLoading}
            onUpdateFileContent={(filePath, newContent) => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.path === filePath || f.name === filePath ? { ...f, content: newContent } : f
                )
              );
            }}
          />
        )}

        {activeTab === 'export' && (
          <ExportReportView 
            auditResult={auditResult} 
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'c4-spec' && (
          <C4SpecModal
            isOpen={true}
            onClose={() => setActiveTab(auditResult ? 'overview' : 'upload')}
          />
        )}
      </main>

      {/* Audit History Drawer */}
      <AuditHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={auditHistory}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        onClearAllHistory={handleClearAllHistory}
        currentSessionId={currentSessionId}
      />

      {/* Enterprise Governance & Architecture Modals (About, Privacy, Terms, Verification) */}
      <EnterpriseGovernanceModals
        isOpen={isGovernanceOpen}
        onClose={() => setIsGovernanceOpen(false)}
        initialTab={governanceTab}
        auditResult={auditResult}
      />

      {/* Deep-Memory Clearance Consent Modal */}
      <ClearanceConsentModal
        isOpen={isClearanceModalOpen}
        onClose={() => setIsClearanceModalOpen(false)}
        preview={memoryPreview}
        repoName={repoName}
        onConfirmOptimize={handleConfirmOptimize}
        onRetainFullSource={handleRetainFullSource}
      />

      {/* D3.js Heap Memory Performance & Lifecycle Analytics Overlay */}
      <MemoryPerformanceOverlay
        isOpen={isMemoryOverlayOpen}
        onClose={() => setIsMemoryOverlayOpen(false)}
        auditResult={auditResult}
        files={files}
        onTriggerOptimization={handleConfirmOptimize}
        isOptimized={isMemoryOptimized}
      />

      {/* Enterprise System Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={handleClearAllHistory}
        historyCount={auditHistory.length}
        frameworkPreferences={frameworkPreferences}
        onUpdateFrameworkPreferences={(prefs) => {
          setFrameworkPreferences(prefs);
          try {
            localStorage.setItem('codepulse_framework_prefs', JSON.stringify(prefs));
          } catch (e) {
            console.warn('Failed to persist framework preferences:', e);
          }
        }}
      />

      {/* Enterprise C4 Architecture Specification & Cost Simulator */}
      <C4SpecModal
        isOpen={isC4SpecOpen}
        onClose={() => setIsC4SpecOpen(false)}
      />

      {/* Enterprise Governance Footer */}
      <EnterpriseFooter
        onOpenGovernance={handleOpenGovernance}
        auditId={auditResult?.id}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
