/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';

interface CodePulseLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textColor?: string;
}

export const CodePulseLogo: React.FC<CodePulseLogoProps> = ({
  className = '',
  size = 32,
  showText = false,
  textColor = 'text-slate-100 dark:text-slate-100 light:text-slate-900'
}) => {
  const uniqueId = useId().replace(/:/g, '');
  const purpleGradId = `cp-purple-${uniqueId}`;
  const pulseGradId = `cp-pulse-${uniqueId}`;
  const glowFilterId = `cp-glow-${uniqueId}`;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
        aria-label="CodePulse Logo"
      >
        <defs>
          {/* Rich Violet/Purple Gradient for the 'C' Letterform */}
          <linearGradient id={purpleGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="40%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>

          {/* Electric Cyan/Neon Pulse Gradient */}
          <linearGradient id={pulseGradId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="45%" stopColor="#22D3EE" />
            <stop offset="70%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>

          {/* High-Contrast Subtle Glow Filter */}
          <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Stylized 'C' Ring (Precision Smooth Path) */}
        {/* Arc starting at top right (72, 22), curving smoothly around left to bottom right (72, 78) */}
        <path
          d="M 72 23
             A 36 36 0 1 0 72 77
             L 66 69
             A 26 26 0 1 1 66 31
             Z"
          fill={`url(#${purpleGradId})`}
          className="transition-all duration-300"
        />

        {/* Top-Right Terminal Bevel Accent */}
        <path
          d="M 72 23 L 80 23 A 36 36 0 0 1 85 36 L 75 39 A 26 26 0 0 0 72 23 Z"
          fill={`url(#${purpleGradId})`}
          opacity="0.9"
        />

        {/* Bottom-Right Terminal Bevel Accent */}
        <path
          d="M 72 77 L 80 77 A 36 36 0 0 0 85 64 L 75 61 A 26 26 0 0 1 72 77 Z"
          fill={`url(#${purpleGradId})`}
          opacity="0.9"
        />

        {/* Horizontal Center ECG Pulse Line (Electric Cyan) */}
        <path
          d="M 10 50
             L 26 50
             L 30 46
             L 34 53
             L 40 40
             L 46 22
             L 54 78
             L 62 30
             L 69 62
             L 76 44
             L 82 50
             L 92 50"
          stroke={`url(#${pulseGradId})`}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowFilterId})`}
        />

        {/* Active Signal Terminal Beacon (Trailing Signal Dot) */}
        <circle
          cx="94"
          cy="50"
          r="2.2"
          fill="#00F0FF"
          filter={`url(#${glowFilterId})`}
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tight">
            <span className={`text-base font-bold tracking-tight ${textColor}`}>
              Code<span className="text-cyan-400">Pulse</span>
            </span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              AI
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase">
            Neural Auditor
          </span>
        </div>
      )}
    </div>
  );
};
