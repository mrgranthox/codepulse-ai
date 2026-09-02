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
import { ActiveTab, CodeFile, AuditResult, AuditHistoryItem } from './types';
import { AlertCircle, CheckCircle2, History } from 'lucide-react';

const STORAGE_KEY = 'codepulse_audit_history_v2';

export default function App() {
  // Always greet user with the clean Upload & Ingestion page first
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload');
  const [repoName, setRepoName] = useState<string>('');
  const [customRules, setCustomRules] = useState<string>('');
  
  // Clean initial state (no hardcoded demo files)
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isC4ModalOpen, setIsC4ModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);

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
      filesCount: scannedFiles.length,
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
    setAuditResult(session.auditResult);
    setRepoName(session.repoName);
    if (session.files && session.files.length > 0) {
      setFiles(session.files);
      setActiveFileIndex(0);
    }
    setCurrentSessionId(session.id);
    setActiveTab('overview');
    setSuccessToast(`Loaded cached report for "${session.repoName}" (${session.overallScore}% Health)`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleDeleteSession = (id: string) => {
    setAuditHistory((prev) => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    setAuditHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
    setSuccessToast('All audit history cleared.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleRunAudit = async () => {
    if (files.length === 0) {
      setErrorMessage('Please upload or provide at least one source file.');
      return;
    }

    // Instantly transition to Storyline Step 2: Execution Scanner
    setIsLoading(true);
    setActiveTab('execution');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          repoName: repoName || 'Custom Codebase',
          customRules
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with HTTP ${response.status}`);
      }

      const data: AuditResult = await response.json();
      setAuditResult(data);
      saveAuditToHistory(data, files);

      // Smooth transition to Overview Dashboard
      setTimeout(() => {
        setIsLoading(false);
        setActiveTab('overview');
        setSuccessToast(`Audit successfully completed for ${repoName || 'Codebase'}!`);
        setTimeout(() => setSuccessToast(null), 4000);
      }, 800);
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setIsLoading(false);
      setActiveTab('upload');
      setErrorMessage(err.message || 'Failed to complete code audit. Please check network/server logs.');
    }
  };

  const handleFetchAndAuditGithub = async (githubUrl: string) => {
    setIsLoading(true);
    setActiveTab('execution');
    setErrorMessage(null);

    try {
      // Step 1: Ingest repository files via GitHub API
      const fetchRes = await fetch('/api/github/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: githubUrl, maxFiles: 10 })
      });

      if (!fetchRes.ok) {
        const err = await fetchRes.json().catch(() => ({}));
        throw new Error(err.error || `Failed to fetch GitHub repository (${fetchRes.status})`);
      }

      const repoData = await fetchRes.json();
      if (!repoData.files || repoData.files.length === 0) {
        throw new Error('No source code files found in the specified GitHub repository.');
      }

      const currentRepoTitle = repoData.repoName || githubUrl;
      setRepoName(currentRepoTitle);
      setFiles(repoData.files);
      setActiveFileIndex(0);

      // Step 2: Automatically trigger deep multi-pass neural audit
      const auditRes = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: repoData.files,
          repoName: currentRepoTitle,
          customRules
        })
      });

      if (!auditRes.ok) {
        const auditErr = await auditRes.json().catch(() => ({}));
        throw new Error(auditErr.error || `Audit analysis failed (${auditRes.status})`);
      }

      const auditData: AuditResult = await auditRes.json();
      setAuditResult(auditData);
      saveAuditToHistory(auditData, repoData.files);

      // Smooth transition to Step 3 Overview Dashboard
      setTimeout(() => {
        setIsLoading(false);
        setActiveTab('overview');
        setSuccessToast(`Successfully imported & audited "${currentRepoTitle}" (${repoData.files.length} files)!`);
        setTimeout(() => setSuccessToast(null), 4000);
      }, 800);
    } catch (err: any) {
      console.error('GitHub ingestion error:', err);
      setIsLoading(false);
      setActiveTab('upload');
      setErrorMessage(err.message || 'Failed to import and audit GitHub repository.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            setActiveTab={setActiveTab}
            onReAudit={handleRunAudit}
            isLoading={isLoading}
            onOpenHistory={() => setIsHistoryOpen(true)}
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
            onNavigate={setActiveTab}
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

      {/* Subtle Enterprise Footer */}
      <footer className="border-t border-slate-800 bg-[#020617] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">CodePulse AI</span>
            <span>•</span>
            <span>Zero-Trust Enterprise Architecture & Security Engine</span>
          </div>
          <div className="flex items-center gap-3">
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
              className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              C4 Specification
            </button>
            <span>•</span>
            <span>Gemini 3.7 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
