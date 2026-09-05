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
  Layers,
  Settings as SettingsIcon
} from 'lucide-react';
import { CodeFile, AuditResult } from '../types';
import { CodePulseLogo } from './CodePulseLogo';

interface UploadSectionProps {
  files: CodeFile[];
  setFiles: React.Dispatch<React.SetStateAction<CodeFile[]>>;
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
  onRunAudit: () => void;
  onFetchAndAuditGithub: (repoUrl: string, maxFiles?: number) => Promise<void>;
  isLoading: boolean;
  repoName: string;
  setRepoName: (name: string) => void;
  customRules: string;
  setCustomRules: (rules: string) => void;
  auditResult: AuditResult | null;
  onOpenSettings?: () => void;
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
  auditResult,
  onOpenSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [ingestMode, setIngestMode] = useState<'github' | 'upload' | 'paste'>('github');
  const [isDragging, setIsDragging] = useState(false);
  const [scrubbedSecretsCount, setScrubbedSecretsCount] = useState(0);
  const [githubUrl, setGithubUrl] = useState('');
  const [scanDepth, setScanDepth] = useState<number>(250);
  const [customMaxFiles, setCustomMaxFiles] = useState<string>('');
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
          path: (file as any).webkitRelativePath || `src/${file.name}`,
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
    const effectiveLimit = customMaxFiles && Number(customMaxFiles) > 0 ? Number(customMaxFiles) : scanDepth;
    try {
      await onFetchAndAuditGithub(githubUrl.trim(), effectiveLimit);
    } finally {
      setIsFetchingGithub(false);
    }
  };

  const activeFile = files[activeFileIndex] || files[0];

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 space-y-8 animate-in fade-in duration-400">
      {/* Centered Hero & High-End Typography */}
      <div className="text-center space-y-3.5 flex flex-col items-center">
        <div className="flex items-center justify-center mb-1">
          <CodePulseLogo size={54} />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span>Zero-Trust Enterprise Neural Auditor</span>
          </div>

          {onOpenSettings && (
            <button
              type="button"
              id="upload-settings-button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-medium cursor-pointer transition-all shadow-sm"
              title="Open Enterprise Settings (Theme, Memory, Security Frameworks, Engine)"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Settings & Themes</span>
            </button>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15]">
          Architectural & Security Audit
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Import any GitHub repository, drop source files, or paste code snippets to generate OWASP security models, C4 diagrams, and side-by-side refactoring diffs.
        </p>
      </div>

      {/* Centered Ingestion Modes Switcher */}
      <div className="flex justify-center w-full">
        <div className="grid grid-cols-3 w-full sm:w-auto p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl gap-1">
          <button
            type="button"
            onClick={() => setIngestMode('github')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[44px] ${
              ingestMode === 'github'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Github className="w-4 h-4 shrink-0" />
            <span className="truncate">GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => setIngestMode('upload')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[44px] ${
              ingestMode === 'upload'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">Upload</span>
            {files.length > 0 && (
              <span className="hidden xs:inline ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 text-[10px] font-mono font-bold">
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
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[44px] ${
              ingestMode === 'paste'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Paste Code</span>
          </button>
        </div>
      </div>

      {/* Main Centered Container */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* MODE 1: GitHub Ingestion */}
        {ingestMode === 'github' && (
          <form onSubmit={handleGithubSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Public GitHub Repository URL or "owner/repo"
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/juice-shop/juice-shop or expressjs/express"
                  className="w-full pl-10 pr-4 py-3 bg-[#0B0F17] border border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none font-mono transition-colors shadow-inner"
                  autoFocus
                />
                <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              
              {/* Quick Benchmark Presets */}
              <div className="flex items-center gap-2 pt-1 flex-wrap text-xs text-slate-400">
                <span className="text-[11px] font-semibold text-slate-400">Test Presets:</span>
                <button
                  type="button"
                  id="preset-juice-shop"
                  onClick={() => setGithubUrl('https://github.com/juice-shop/juice-shop')}
                  className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-indigo-300 hover:text-white transition-colors cursor-pointer"
                >
                  OWASP Juice Shop
                </button>
                <button
                  type="button"
                  onClick={() => setGithubUrl('https://github.com/expressjs/express')}
                  className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-indigo-300 hover:text-white transition-colors cursor-pointer"
                >
                  Express.js
                </button>
                <button
                  type="button"
                  onClick={() => setGithubUrl('https://github.com/fastify/fastify')}
                  className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-indigo-300 hover:text-white transition-colors cursor-pointer"
                >
                  Fastify
                </button>
              </div>
            </div>

            {/* Enterprise Ingestion Depth Selector */}
            <div className="p-3.5 bg-[#0B0F17] border border-slate-800/90 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Enterprise Ingestion Scan Depth
                </span>
                <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                  {customMaxFiles ? `${customMaxFiles} max files` : `${scanDepth} files target`}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => { setScanDepth(100); setCustomMaxFiles(''); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    scanDepth === 100 && !customMaxFiles
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Standard (100)
                </button>
                <button
                  type="button"
                  onClick={() => { setScanDepth(250); setCustomMaxFiles(''); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    scanDepth === 250 && !customMaxFiles
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Deep (250)
                </button>
                <button
                  type="button"
                  onClick={() => { setScanDepth(500); setCustomMaxFiles(''); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    scanDepth === 500 && !customMaxFiles
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Enterprise (500)
                </button>
                <div className="col-span-3 sm:col-span-1">
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={customMaxFiles}
                    onChange={(e) => setCustomMaxFiles(e.target.value)}
                    placeholder="Custom (e.g. 350)"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Prioritizes routes, controllers, middleware, models, database schemas, and business logic across the entire repository tree.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || isFetchingGithub || !githubUrl.trim()}
              className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                isLoading || isFetchingGithub || !githubUrl.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
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
                  <span>Fetch & Run Full Audit ({customMaxFiles || scanDepth} max files)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        )}

        {/* MODE 2: File & Folder Upload */}
        {ingestMode === 'upload' && (
          <div className="space-y-6">
            {/* Dropzone & Browse Actions */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all duration-200 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-950/40 scale-[0.99]'
                  : 'border-slate-800 hover:border-slate-700 bg-[#0B0F17]/80 hover:bg-[#0B0F17]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => processFiles(e.target.files)}
                accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.json,.sql,.yaml,.yml,.c,.cpp,.h,.php,.rb,.cs,.vue,.svelte,.graphql,.prisma,.sh"
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

              <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-400 mx-auto mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 tracking-tight">
                Drop your codebase files or directory here
              </h3>
              
              <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  Browse Files
                </button>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Upload Whole Folder</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mt-4">
                Supports TypeScript, Python, Go, Rust, Java, JavaScript, SQL, YAML, PHP, Ruby, C#, and JSON with zero file count artificial ceiling.
              </p>
            </div>

            {/* Uploaded Files Staging List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Staged Files for Analysis ({files.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {files.map((file, idx) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs"
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
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
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
              className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                isLoading || files.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      idx === activeFileIndex
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-[#0B0F17] text-slate-400 hover:text-slate-200 border border-slate-800'
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
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer font-medium"
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
                  className="px-2.5 py-1 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs font-mono text-indigo-300 w-36 text-right focus:outline-none focus:border-indigo-500"
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
                className="w-full p-4 bg-[#0B0F17] border border-slate-800 rounded-lg font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed selection:bg-indigo-500/30"
              />
            </div>

            {/* Audit Trigger */}
            <button
              type="button"
              onClick={onRunAudit}
              disabled={isLoading || !activeFile?.content.trim()}
              className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                isLoading || !activeFile?.content.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
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
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Codebase / Project Label
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="e.g., payment-service or my-app"
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Custom Compliance & Architectural Constraints (Optional)
                </label>
                <textarea
                  value={customRules}
                  onChange={(e) => setCustomRules(e.target.value)}
                  placeholder="e.g., Enforce ISO27001 zero-trust, disallow direct SQL strings, require circuit breakers for external microservices..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zero-Trust Security Guarantee Banner */}
      <div className="p-4 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-center flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-400 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Client-Side Zero-Trust Redaction</span>
        </div>
        <span className="hidden sm:inline text-slate-600">•</span>
        <span className="text-slate-300">API keys, JWTs, and secrets are scrubbed before payload transmission.</span>
        {scrubbedSecretsCount > 0 && (
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
            {scrubbedSecretsCount} secret(s) redacted
          </span>
        )}
      </div>
    </div>
  );
};
