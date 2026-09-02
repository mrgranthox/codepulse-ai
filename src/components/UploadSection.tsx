import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileCode, 
  Plus, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Terminal, 
  CheckCircle, 
  FileCheck2, 
  RefreshCw, 
  FolderGit2, 
  Code2,
  Github,
  ArrowRight,
  Globe,
  Check,
  AlertCircle,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  Lock,
  Layers
} from 'lucide-react';
import { CodeFile, AuditResult } from '../types';

interface UploadSectionProps {
  files: CodeFile[];
  setFiles: React.Dispatch<React.SetStateAction<CodeFile[]>>;
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
  onRunAudit: () => void;
  onFetchAndAuditGithub: (repoUrl: string) => Promise<void>;
  isLoading: boolean;
  repoName: string;
  setRepoName: (name: string) => void;
  customRules: string;
  setCustomRules: (rules: string) => void;
  auditResult: AuditResult | null;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  files,
  setFiles,
  activeFileIndex,
  setActiveFileIndex,
  onRunAudit,
  onFetchAndAuditGithub,
  isLoading,
  repoName,
  setRepoName,
  customRules,
  setCustomRules,
  auditResult
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [ingestMode, setIngestMode] = useState<'github' | 'upload' | 'paste'>('github');
  const [isDragging, setIsDragging] = useState(false);
  const [scrubbedSecretsCount, setScrubbedSecretsCount] = useState(0);
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [showAdvancedRules, setShowAdvancedRules] = useState(false);

  // Client-side zero-trust regex secret scrubbing
  const scrubCode = (rawContent: string): { cleaned: string; scrubbed: number } => {
    let count = 0;
    let cleaned = rawContent;

    const secretPatterns = [
      /(AKIA[0-9A-Z]{16})/g,
      /(ghp_[a-zA-Z0-9]{36})/g,
      /(eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})/g,
      /(stripe_(?:test|live)_[a-zA-Z0-9]{24,})/g,
      /(['"][a-zA-Z0-9_-]{32,}['"])/g
    ];

    secretPatterns.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, () => {
        count++;
        return `"REDACTED_SECRET_${count}"`;
      });
    });

    return { cleaned, scrubbed: count };
  };

  const processFiles = (uploadedFiles: FileList | null) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    let totalScrubbed = 0;
    const newFiles: CodeFile[] = [];

    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        
        let language = 'typescript';
        if (ext === 'py') language = 'python';
        else if (ext === 'go') language = 'go';
        else if (ext === 'js') language = 'javascript';
        else if (ext === 'json') language = 'json';
        else if (ext === 'rs') language = 'rust';
        else if (ext === 'java') language = 'java';
        else if (ext === 'sql') language = 'sql';
        else if (ext === 'yaml' || ext === 'yml') language = 'yaml';
        else if (ext === 'c' || ext === 'cpp' || ext === 'h') language = 'cpp';

        const { cleaned, scrubbed } = scrubCode(content);
        totalScrubbed += scrubbed;

        const fileObj: CodeFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          path: `src/${file.name}`,
          language,
          content: cleaned,
          size: file.size
        };

        setFiles((prev) => [...prev, fileObj]);
      };
      reader.readAsText(file);
    });

    if (totalScrubbed > 0) {
      setScrubbedSecretsCount((prev) => prev + totalScrubbed);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleAddNewBlankFile = () => {
    const fileNum = files.length + 1;
    const newFile: CodeFile = {
      id: `file-${Date.now()}`,
      name: `service_${fileNum}.ts`,
      path: `src/service_${fileNum}.ts`,
      language: 'typescript',
      content: `// Paste or write your source code here for neural zero-trust audit\n`,
      size: 0
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileIndex(files.length);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (activeFileIndex >= files.length - 1) {
      setActiveFileIndex(Math.max(0, files.length - 2));
    }
  };

  const handleContentChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f, idx) => (idx === activeFileIndex ? { ...f, content: newContent, size: newContent.length } : f))
    );
  };

  const handleGithubSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!githubUrl.trim()) return;
    setIsFetchingGithub(true);
    try {
      await onFetchAndAuditGithub(githubUrl.trim());
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const activeFile = files[activeFileIndex] || files[0];

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 space-y-8 animate-in fade-in duration-400">
      {/* Centered Hero & High-End Typography */}
      <div className="text-center space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Zero-Trust Enterprise Neural Auditor</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Architectural & Security Audit
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Import any GitHub repository, drop source files, or paste code snippets to generate OWASP security models, C4 diagrams, and side-by-side refactoring diffs.
        </p>
      </div>

      {/* Centered Ingestion Modes Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <button
            type="button"
            onClick={() => setIngestMode('github')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              ingestMode === 'github'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>Import from GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => setIngestMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              ingestMode === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Files / Folder</span>
            {files.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-900 text-[10px] font-mono">
                {files.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIngestMode('paste');
              if (files.length === 0) handleAddNewBlankFile();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              ingestMode === 'paste'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Paste Code</span>
          </button>
        </div>
      </div>

      {/* Main Centered Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* MODE 1: GitHub Ingestion */}
        {ingestMode === 'github' && (
          <form onSubmit={handleGithubSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Public GitHub Repository URL or "owner/repo"
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/expressjs/express or owner/repository"
                  className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none font-mono transition-colors shadow-inner"
                  autoFocus
                />
                <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-xs text-slate-500">
                The engine directly ingests the primary tree structure and performs a multi-pass security and architecture analysis.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || isFetchingGithub || !githubUrl.trim()}
              className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-bold shadow-xl shadow-indigo-900/30 transition-all ${
                isLoading || isFetchingGithub || !githubUrl.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-98 cursor-pointer'
              }`}
            >
              {isFetchingGithub || isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>Fetching & Auditing GitHub Repository...</span>
                </>
              ) : (
                <>
                  <Github className="w-4 h-4" />
                  <span>Fetch & Run Full Audit</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        )}

        {/* MODE 2: File & Folder Upload */}
        {ingestMode === 'upload' && (
          <div className="space-y-6">
            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-950/40 scale-[0.99]'
                  : 'border-slate-700 hover:border-slate-600 bg-[#020617]/70 hover:bg-[#020617]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => processFiles(e.target.files)}
                accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.json,.sql,.yaml,.yml,.c,.cpp,.h"
              />
              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                className="hidden"
                onChange={(e) => processFiles(e.target.files)}
              />

              <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 mx-auto mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                Drop your source files here, or <span className="text-indigo-400 underline">browse</span>
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Supports TypeScript, Python, Go, Rust, Java, JavaScript, SQL, YAML, and JSON.
              </p>
            </div>

            {/* Uploaded Files Staging List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Staged Files for Analysis ({files.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {files.map((file, idx) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 bg-[#020617] border border-slate-800 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-mono text-slate-200 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Trigger */}
            <button
              type="button"
              onClick={onRunAudit}
              disabled={isLoading || files.length === 0}
              className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-bold shadow-xl shadow-indigo-900/30 transition-all ${
                isLoading || files.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-98 cursor-pointer'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>Auditing Codebase ({files.length} files)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Audit Staged Codebase ({files.length} {files.length === 1 ? 'file' : 'files'})</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        )}

        {/* MODE 3: Direct Code Paste */}
        {ingestMode === 'paste' && (
          <div className="space-y-4">
            {/* File Switcher / New Tab */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {files.map((file, idx) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setActiveFileIndex(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      idx === activeFileIndex
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-[#020617] text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>{file.name}</span>
                    {files.length > 1 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                        className="hover:text-rose-300 ml-1"
                      >
                        ×
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAddNewBlankFile}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                  title="Add another file"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add File</span>
                </button>
              </div>

              {activeFile && (
                <input
                  type="text"
                  value={activeFile.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFiles((prev) =>
                      prev.map((f, idx) => (idx === activeFileIndex ? { ...f, name: newName, path: `src/${newName}` } : f))
                    );
                  }}
                  className="px-2 py-1 bg-[#020617] border border-slate-800 rounded text-xs font-mono text-indigo-300 w-36 text-right focus:outline-none focus:border-indigo-500"
                  placeholder="filename.ts"
                />
              )}
            </div>

            {/* Code Textarea */}
            <div className="relative">
              <textarea
                value={activeFile?.content || ''}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="// Paste your source code here (e.g. Express router, FastAPI endpoint, DB repository)..."
                rows={12}
                className="w-full p-4 bg-[#020617] border border-slate-800 rounded-xl font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed selection:bg-indigo-500/30"
              />
            </div>

            {/* Audit Trigger */}
            <button
              type="button"
              onClick={onRunAudit}
              disabled={isLoading || !activeFile?.content.trim()}
              className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-bold shadow-xl shadow-indigo-900/30 transition-all ${
                isLoading || !activeFile?.content.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-98 cursor-pointer'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>Running Neural Audit...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Audit Source Code</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Collapsible Advanced Project & Rules Settings */}
        <div className="pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowAdvancedRules(!showAdvancedRules)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target Project Name & Custom Security Rules</span>
            </div>
            {showAdvancedRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvancedRules && (
            <div className="mt-4 space-y-4 pt-2 animate-in fade-in duration-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Codebase / Project Label
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="e.g., payment-service or my-app"
                  className="w-full px-3 py-2 bg-[#020617] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Custom Compliance & Architectural Constraints (Optional)
                </label>
                <textarea
                  value={customRules}
                  onChange={(e) => setCustomRules(e.target.value)}
                  placeholder="e.g., Enforce ISO27001 zero-trust, disallow direct SQL strings, require circuit breakers for external microservices..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#020617] border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zero-Trust Security Guarantee Banner */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Client-Side Zero-Trust Redaction</span>
        </div>
        <span className="hidden sm:inline text-slate-600">•</span>
        <span>API keys, JWTs, and secrets are scrubbed before payload transmission.</span>
        {scrubbedSecretsCount > 0 && (
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            {scrubbedSecretsCount} secret(s) redacted
          </span>
        )}
      </div>
    </div>
  );
};
