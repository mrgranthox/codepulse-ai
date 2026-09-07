import React from 'react';
import { ShieldCheck, Lock, Globe, Server, CheckCircle2 } from 'lucide-react';
import { GovernanceModalTab } from './EnterpriseGovernanceModals';

interface EnterpriseFooterProps {
  onOpenGovernance: (tab: GovernanceModalTab) => void;
  auditId?: string;
}

export const EnterpriseFooter: React.FC<EnterpriseFooterProps> = ({
  onOpenGovernance,
  auditId
}) => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-[#0B0F17]/90 py-8 px-4 sm:px-6 lg:px-8 text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>CodePulse Enterprise AI</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 hidden sm:inline">
            Zero-Trust AST Engine & Architectural Auditor
          </span>
        </div>

        {/* Center: Governance Links */}
        <div className="flex items-center gap-5 flex-wrap justify-center font-medium">
          <button
            type="button"
            onClick={() => onOpenGovernance('about')}
            className="hover:text-indigo-400 transition-colors cursor-pointer"
          >
            About & Architecture
          </button>
          <button
            type="button"
            onClick={() => onOpenGovernance('privacy')}
            className="hover:text-indigo-400 transition-colors cursor-pointer"
          >
            Privacy Policy & Zero Retention
          </button>
          <button
            type="button"
            onClick={() => onOpenGovernance('terms')}
            className="hover:text-indigo-400 transition-colors cursor-pointer"
          >
            Terms of Service & SLA
          </button>
          {auditId && (
            <button
              type="button"
              onClick={() => onOpenGovernance('verify')}
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Lock className="w-3 h-3" />
              <span>Verify Integrity (SHA-256)</span>
            </button>
          )}
        </div>

        {/* Right: Security Attestation Badge */}
        <div className="text-[11px] font-mono text-slate-500">
          EU-WEST-2 • RLS Enforced • SOC2 Ready
        </div>
      </div>
    </footer>
  );
};
