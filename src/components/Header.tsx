import React, { useState } from 'react';
import { 
  History,
  Plus,
  ArrowRight,
  Shield,
  Activity,
  Menu,
  X,
  BookOpen,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Cpu
} from 'lucide-react';
import { ActiveTab, AuditResult } from '../types';
import { CodePulseLogo } from './CodePulseLogo';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  auditResult: AuditResult | null;
  isLoading: boolean;
  onRunAudit: () => void;
  onNewAudit: () => void;
  hasFiles: boolean;
  onOpenHistory: () => void;
  historyCount: number;
  onOpenSettings?: () => void;
  onOpenMemory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  auditResult,
  isLoading,
  onRunAudit,
  onNewAudit,
  hasFiles,
  onOpenHistory,
  historyCount,
  onOpenSettings,
  onOpenMemory
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mode, effectiveTheme, toggleTheme, setMode } = useTheme();
  const isExtendedWorkspace = activeTab !== 'upload' && activeTab !== 'execution' && auditResult !== null;
  const healthScore = auditResult?.summary.overallHealthScore ?? 92;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/90 dark:border-slate-800/90 light:border-slate-200 bg-[#0B0F17]/95 dark:bg-[#0B0F17]/95 light:bg-white/95 backdrop-blur-xl transition-all">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity with uploaded CodePulse logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onNewAudit}
              className="flex items-center gap-2.5 sm:gap-3 group text-left transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <CodePulseLogo size={36} />
              
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-base sm:text-lg tracking-tight text-white dark:text-white light:text-slate-900 group-hover:text-indigo-400 transition-colors truncate">
                    CodePulse AI
                  </span>
                </div>
                <div className="hidden xs:flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium truncate">
                    Zero-Trust Neural AST Engine
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Right Status Controls & Actions for Desktop */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-2.5">
            {/* System Health Metric */}
            {isExtendedWorkspace && (
              <div className="hidden xl:flex flex-col w-32 mr-1 p-1.5 px-3 bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-lg backdrop-blur-md">
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span className="text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase font-semibold tracking-wider text-[9px]">HEALTH SCORE</span>
                  <span className="font-mono text-emerald-400 font-bold">{healthScore}%</span>
                </div>
                <div className="w-full bg-slate-800 dark:bg-slate-800 light:bg-slate-300 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${healthScore}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Quick Return to Last Report */}
            {activeTab === 'upload' && auditResult && (
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-xs font-semibold text-indigo-300 hover:text-white transition-all duration-200 hover:-translate-y-0.5 cursor-pointer min-h-[40px]"
              >
                <span>View Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* History Dropdown / Drawer Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-indigo-400 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer min-h-[40px]"
              title="View past saved audit reports"
            >
              <History className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-indigo-950 dark:bg-indigo-950 light:bg-indigo-100 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 border border-indigo-800/50">
                  {historyCount}
                </span>
              )}
            </button>

            {/* System Theme Segmented Switcher (Auto / Dark / Light) */}
            <div className="flex items-center p-0.5 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg shadow-inner">
              <button
                type="button"
                id="theme-btn-system"
                onClick={() => setMode('system')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  mode === 'system'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-100 light:text-slate-600 light:hover:text-slate-900'
                }`}
                title="Auto: Automatically synchronizes with your device OS daylight / dark schedule"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Auto</span>
              </button>

              <button
                type="button"
                id="theme-btn-dark"
                onClick={() => setMode('dark')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  mode === 'dark'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-100 light:text-slate-600 light:hover:text-slate-900'
                }`}
                title="Dark: Obsidian zero-trust dark theme"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Dark</span>
              </button>

              <button
                type="button"
                id="theme-btn-light"
                onClick={() => setMode('light')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  mode === 'light'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-100 light:text-slate-600 light:hover:text-slate-900'
                }`}
                title="Light: High-contrast daylight executive theme"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Light</span>
              </button>
            </div>

            {/* Enterprise Settings Button */}
            {onOpenSettings && (
              <button
                type="button"
                id="header-settings-button"
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-700 hover:text-white transition-all duration-200 hover:-translate-y-0.5 cursor-pointer min-h-[40px] shadow-sm"
                title="Open Enterprise Settings (Theme, Memory, Security Frameworks, Engine)"
              >
                <SettingsIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="inline">Settings</span>
              </button>
            )}

            {/* In Extended Workspace: "+ New Audit" button */}
            {isExtendedWorkspace && (
              <button
                type="button"
                onClick={onNewAudit}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>New Audit</span>
              </button>
            )}
          </div>

          {/* Mobile Quick Action Buttons & Menu Trigger */}
          <div className="flex sm:hidden items-center gap-1.5">
            {/* Quick Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-lg bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {effectiveTheme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {/* Quick History Button with Badge */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="relative p-2.5 rounded-lg bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-indigo-400 hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              title="Audit History"
              aria-label="Audit History"
            >
              <History className="w-4 h-4" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Main Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-200 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-800 dark:border-slate-800 light:border-slate-200 py-3.5 px-2 space-y-2.5 bg-[#0B0F17] dark:bg-[#0B0F17] light:bg-white animate-fadeIn">
            {/* Health score badge on mobile if available */}
            {isExtendedWorkspace && (
              <div className="p-3 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-700">Code Health Score</span>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  {healthScore}%
                </span>
              </div>
            )}

            {/* In Extended Workspace: "+ New Audit" button */}
            {isExtendedWorkspace && (
              <button
                type="button"
                onClick={() => {
                  onNewAudit();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition-all min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Audit</span>
              </button>
            )}

            {/* Return to Report if on Upload tab */}
            {activeTab === 'upload' && auditResult && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-950/90 border border-indigo-700/60 text-xs font-semibold text-indigo-300 min-h-[44px]"
              >
                <span>View Latest Audit Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Theme Selector (Segmented for Mobile) */}
            <div className="p-2 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Theme</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setMode('system')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all min-h-[40px] cursor-pointer ${
                    mode === 'system'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Auto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all min-h-[40px] cursor-pointer ${
                    mode === 'dark'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all min-h-[40px] cursor-pointer ${
                    mode === 'light'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
              </div>
            </div>

            {/* Heap Memory Overlay Trigger */}
            {onOpenMemory && (
              <button
                type="button"
                onClick={() => {
                  onOpenMemory();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 text-xs font-semibold border border-slate-800 dark:border-slate-800 light:border-slate-200 min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>D3 Heap Memory Analytics</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}

            {/* Enterprise Settings Button */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 text-xs font-semibold border border-slate-800 dark:border-slate-800 light:border-slate-200 min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4 text-indigo-400" />
                  <span>Settings & Rule Frameworks</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
