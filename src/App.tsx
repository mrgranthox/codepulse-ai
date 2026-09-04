/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { C4SpecModal } from './components/C4SpecModal';
import { ClearanceConsentModal } from './components/ClearanceConsentModal';
import { SettingsModal } from './components/SettingsModal';
import { MemoryPerformanceOverlay } from './components/MemoryPerformanceOverlay';
import { ThemeProvider } from './context/ThemeContext';
import { ActiveTab, CodeFile, AuditResult, AuditHistoryItem } from './types';
import { AlertCircle, CheckCircle2, History, Cpu, Sparkles } from 'lucide-react';
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
  const [isC4ModalOpen, setIsC4ModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMemoryOverlayOpen, setIsMemoryOverlayOpen] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [isMemoryOptimized, setIsMemoryOptimized] = useState<boolean>(false);

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

  // Confirm memory optimization routine (prunes clean files buffers)
  const handleConfirmOptimize = () => {
    const rawFilesToClean = pendingRawFiles || files;
    const currentAudit = pendingAuditData || auditResult;
    const optResult = optimizeFileMemory(rawFilesToClean, currentAudit);
    
    setFiles(optResult.optimizedFiles);
    setIsMemoryOptimized(true);
    setIsClearanceModalOpen(false);
    setPendingRawFiles(null);
    setPendingAuditData(null);

    setSuccessToast(`Memory optimized: ${optResult.estimatedHeapFreedMb} MB RAM freed (${optResult.cleanFilesCount} clean files pruned, ${optResult.retainedFilesCount} finding files preserved verbatim)`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // User decides to retain 100% full source in client memory
  const handleRetainFullSource = () => {
    if (pendingRawFiles) {
      setFiles(pendingRawFiles);
    }
    setIsClearanceModalOpen(false);
    setPendingRawFiles(null);
    setPendingAuditData(null);

    setSuccessToast(`Full source retained: 100% of raw codebase files kept in memory for deep-dive analysis.`);
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
    }

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          repoName: repoName || 'Custom Codebase',
          customRules
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const auditData: AuditResult = await response.json();
      setAuditResult(auditData);

      // Evaluate memory footprint and check session preference
      const preview = previewMemoryOptimization(files, auditData);
      setMemoryPreview(preview);
      const pref = sessionStorage.getItem(MEMORY_PREF_KEY);

      if (pref === 'optimize') {
        const optResult = optimizeFileMemory(files, auditData);
        setFiles(optResult.optimizedFiles);
        setIsMemoryOptimized(true);
        saveAuditToHistory(auditData, optResult.optimizedFiles);
        setTimeout(() => {
          setIsLoading(false);
          setActiveTab('overview');
          setSuccessToast(`Audit complete! Auto-cleared ${optResult.cleanFilesCount} clean files (~${optResult.estimatedHeapFreedMb} MB freed)`);
          setTimeout(() => setSuccessToast(null), 4500);
        }, 800);
      } else if (pref === 'retain') {
        saveAuditToHistory(auditData, files);
        setTimeout(() => {
          setIsLoading(false);
          setActiveTab('overview');
          setSuccessToast(`Audit complete! 100% full source retained locally.`);
          setTimeout(() => setSuccessToast(null), 4500);
        }, 800);
      } else {
        // Trigger ClearanceConsent modal if clean files exist
        setPendingRawFiles(files);
        setPendingAuditData(auditData);
        saveAuditToHistory(auditData, files);

        setTimeout(() => {
          setIsLoading(false);
          setActiveTab('overview');
          if (preview.cleanFilesCount > 0) {
            setIsClearanceModalOpen(true);
          } else {
            setSuccessToast(`Audit completed successfully (${auditData.scannedFilesCount || files.length} files scanned)!`);
            setTimeout(() => setSuccessToast(null), 4500);
          }
        }, 800);
      }
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setIsLoading(false);
      setActiveTab('upload');
      setErrorMessage(err.message || 'Failed to complete codebase audit.');
    }
  };

  // GitHub direct fetch & audit
  const handleFetchAndAuditGithub = async (repoUrl: string, maxFiles: number = 250) => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveTab('execution');

    if (auditResult) {
      setPreviousAuditResult(auditResult);
    }

    try {
      const response = await fetch('/api/github-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      // Evaluate memory footprint and check session preference
      const preview = previewMemoryOptimization(repoData.files, auditData);
      setMemoryPreview(preview);
      const pref = sessionStorage.getItem(MEMORY_PREF_KEY);

      if (pref === 'optimize') {
        const optResult = optimizeFileMemory(repoData.files, auditData);
        setFiles(optResult.optimizedFiles);
        setIsMemoryOptimized(true);
        saveAuditToHistory(auditData, optResult.optimizedFiles);
        setTimeout(() => {
          setIsLoading(false);
          setActiveTab('overview');
          setSuccessToast(`Imported "${currentRepoTitle}" & auto-pruned ${optResult.cleanFilesCount} clean files (~${optResult.estimatedHeapFreedMb} MB RAM freed)`);
          setTimeout(() => setSuccessToast(null), 4500);
        }, 800);
      } else if (pref === 'retain') {
        setFiles(repoData.files);
        saveAuditToHistory(auditData, repoData.files);
        setTimeout(() => {
          setIsLoading(false);
          setActiveTab('overview');
          setSuccessToast(`Successfully imported & audited "${currentRepoTitle}" (100% full source retained locally)!`);
          setTimeout(() => setSuccessToast(null), 4500);
        }, 800);
      } else {
        // Trigger ClearanceConsent modal if clean files exist, preserving raw source in client memory
        setPendingRawFiles(repoData.files);
        setPendingAuditData(auditData);
        setFiles(repoData.files);
        saveAuditToHistory(auditData, repoData.files);

        setTimeout(() => {
          setIsLoading(false);
          setActiveTab('overview');
          if (preview.cleanFilesCount > 0) {
            setIsClearanceModalOpen(true);
          } else {
            setSuccessToast(`Successfully imported & audited "${currentRepoTitle}" (${auditData.scannedFilesCount || repoData.files.length} files scanned)!`);
            setTimeout(() => setSuccessToast(null), 4500);
          }
        }, 800);
      }
    } catch (err: any) {
      console.error('GitHub ingestion error:', err);
      setIsLoading(false);
      setActiveTab('upload');
      setErrorMessage(err.message || 'Failed to import and audit GitHub repository.');
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
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={auditHistory.length}
        onOpenSpec={() => setIsC4ModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMemory={() => setIsMemoryOverlayOpen(true)}
      />

      {/* Toast Notifications */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-rose-950/90 border border-rose-500/40 text-rose-200 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 text-rose-400 hover:text-white font-bold"
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
          />
        )}

        {activeTab === 'execution' && (
          <ExecutionScanner
            files={files}
            repoName={repoName}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewDashboard
            auditResult={auditResult}
            previousAuditResult={previousAuditResult}
            setActiveTab={setActiveTab}
            onReAudit={handleRunAudit}
            isLoading={isLoading}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenSpec={() => setIsC4ModalOpen(true)}
            onOpenMemoryConsent={handleOpenMemoryConsent}
            onOpenMemoryOverlay={() => setIsMemoryOverlayOpen(true)}
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

      {/* C4 Engineering Specification Modal */}
      <C4SpecModal isOpen={isC4ModalOpen} onClose={() => setIsC4ModalOpen(false)} />

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
      />

      {/* Subtle Enterprise Footer */}
      <footer className="border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 bg-[#090D16] dark:bg-[#090D16] light:bg-slate-100 py-4 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">CodePulse AI</span>
            <span>•</span>
            <span>Zero-Trust Enterprise Architecture & Security Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMemoryOverlayOpen(true)}
              className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>Heap Telemetry (D3)</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Settings</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <History className="w-3 h-3 text-indigo-400" />
              <span>Audit History ({auditHistory.length})</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsC4ModalOpen(true)}
              className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Spec & Addendum (Sec 1–14)</span>
            </button>
            <span>•</span>
            <span>Gemini 3.7 Flash</span>
          </div>
        </div>
      </footer>
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
