import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Monitor, 
  Cpu, 
  ShieldCheck, 
  Sliders, 
  Trash2, 
  X, 
  CheckCircle2, 
  RotateCcw,
  HardDrive,
  FileCode,
  Sparkles,
  Lock,
  Zap
} from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { CodePulseLogo } from './CodePulseLogo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory?: () => void;
  onResetPreferences?: () => void;
  historyCount?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearHistory,
  onResetPreferences,
  historyCount = 0
}) => {
  const { mode, effectiveTheme, setMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'theme' | 'memory' | 'security' | 'engine'>('theme');
  const [memoryPolicy, setMemoryPolicy] = useState<string>(() => {
    return localStorage.getItem('codepulse_memory_pref_v1') || 'ask';
  });
  const [maxGithubFiles, setMaxGithubFiles] = useState<number>(() => {
    return Number(localStorage.getItem('codepulse_max_files') || '250');
  });
  const [owaspEnabled, setOwaspEnabled] = useState<boolean>(true);
  const [cweEnabled, setCweEnabled] = useState<boolean>(true);
  const [soc2Enabled, setSoc2Enabled] = useState<boolean>(true);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveMemoryPolicy = (val: string) => {
    setMemoryPolicy(val);
    if (val === 'ask') {
      sessionStorage.removeItem('codepulse_memory_pref_v1');
    } else {
      sessionStorage.setItem('codepulse_memory_pref_v1', val);
    }
    triggerSaveToast('Memory clearance policy updated.');
  };

  const handleSaveGithubMaxFiles = (val: number) => {
    setMaxGithubFiles(val);
    localStorage.setItem('codepulse_max_files', String(val));
    triggerSaveToast(`Default GitHub ingestion limit set to ${val} files.`);
  };

  const triggerSaveToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#0D121F] dark:bg-[#0D121F] light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-800 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 bg-[#0B0F17] dark:bg-[#0B0F17] light:bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
                  Enterprise System Settings
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-0.5">
                Configure global theme, memory clearance policies, and zero-trust security rule engines.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 dark:border-slate-800 light:border-slate-200 bg-[#0A0E17] dark:bg-[#0A0E17] light:bg-slate-100 px-4 pt-2 gap-2 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'theme'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Theme & UI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'memory'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Memory & Clearance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Frameworks</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'engine'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white light:text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Model & Engine</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-[#090D16] dark:bg-[#090D16] light:bg-slate-50">
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Color Appearance & Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* System Default */}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('system');
                      triggerSaveToast('Theme set to System Default (Auto-detect).');
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                      mode === 'system'
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 shadow-md ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-5 h-5 text-indigo-400" />
                    <span>System Auto</span>
                    <span className="text-[10px] text-slate-500">Syncs with OS</span>
                  </button>

                  {/* Dark Mode */}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('dark');
                      triggerSaveToast('Theme set to Enterprise Dark.');
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                      mode === 'dark'
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 shadow-md ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-purple-400" />
                    <span>Dark Obsidian</span>
                    <span className="text-[10px] text-slate-500">Zero-Trust High Contrast</span>
                  </button>

                  {/* Light Mode */}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('light');
                      triggerSaveToast('Theme set to Executive Light.');
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                      mode === 'light'
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 shadow-md ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-400" />
                    <span>Executive Light</span>
                    <span className="text-[10px] text-slate-500">Daylight Contrast</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Current Active Rendering State:
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Currently rendering in <strong className="text-indigo-300 capitalize">{effectiveTheme}</strong> mode (Preference: <strong className="text-indigo-300 capitalize">{mode}</strong>). All IDE diff views, syntax highlighters, C4 graphs, and D3 telemetry charts automatically calibrate their palettes for optimal visual ergonomics.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Deep-Memory Clearance Policy
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'ask',
                      title: 'Always Ask via ClearanceConsent Modal (Recommended)',
                      desc: 'Shows interactive dialog summarizing estimated heap savings and clean files before executing buffer prunes.'
                    },
                    {
                      id: 'optimize',
                      title: 'Auto-Optimize Clean Buffers',
                      desc: 'Automatically releases clean file string buffers upon audit completion to maximize browser responsiveness.'
                    },
                    {
                      id: 'retain',
                      title: 'Always Retain 100% Full Source in State',
                      desc: 'Never prunes raw source code strings. Best for smaller repos or offline full-file auditing.'
                    }
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => handleSaveMemoryPolicy(opt.id)}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        memoryPolicy === opt.id
                          ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/40'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="memoryPolicy"
                        checked={memoryPolicy === opt.id}
                        onChange={() => {}}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">{opt.title}</span>
                        <span className="text-[11px] text-slate-400 block leading-relaxed">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  GitHub Enterprise Ingestion Limit
                </label>
                <div className="flex items-center gap-2">
                  {[100, 250, 500, 1000].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSaveGithubMaxFiles(num)}
                      className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                        maxGithubFiles === num
                          ? 'border-indigo-500 bg-indigo-950 text-indigo-200'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {num} files
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Active Security & Quality Frameworks
              </label>

              <div className="space-y-2">
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      OWASP Top 10 (2025/2026) Audit Rules
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Injection, Broken Auth, Cryptographic Failures, SSRF, and Insecure Design.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={owaspEnabled}
                    onChange={(e) => setOwaspEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      CWE Top 25 Most Dangerous Software Weaknesses
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Buffer flaws, Command Injection, Prototype Pollution, and Path Traversal.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cweEnabled}
                    onChange={(e) => setCweEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      SOC 2 & ISO 27001 Compliance Architecture
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Evaluates least privilege, audit logging, zero-trust perimeter, and token lifecycle.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={soc2Enabled}
                    onChange={(e) => setSoc2Enabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'engine' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <CodePulseLogo size={28} />
                  <div>
                    <h4 className="text-xs font-bold text-white">Google Gemini 3.7 Flash Engine</h4>
                    <span className="text-[11px] text-slate-400">Deep Multi-Pass AST & Neural Flow Analyzer</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                    <span className="text-slate-500 block">Inference Speed</span>
                    <span className="text-emerald-400 font-bold">~1.2s avg scan latency</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800/80">
                    <span className="text-slate-500 block">Context Window</span>
                    <span className="text-indigo-300 font-bold">1,000,000 Tokens</span>
                  </div>
                </div>
              </div>

              {/* Data & History Reset */}
              <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-2">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  Audit History & Local Storage Cache
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Currently holding {historyCount} cached audit sessions in local browser storage.
                </p>
                {onClearHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearHistory();
                      triggerSaveToast('All audit history cleared from localStorage.');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold border border-rose-700/60 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Cached Sessions ({historyCount})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Toast feedback */}
          {saveToast && (
            <div className="p-2.5 bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveToast}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 bg-[#0B0F17] dark:bg-[#0B0F17] light:bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CodePulseLogo size={20} />
            <span className="text-[11px] text-slate-400">CodePulse Enterprise Zero-Trust</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
