/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import { useTheme } from '../context/ThemeContext';

interface CodePulseLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textColor?: string;
  useAnimation?: boolean;
}

export const CodePulseLogo: React.FC<CodePulseLogoProps> = ({
  className = '',
  size = 32,
  showText = false,
  textColor = 'text-slate-100 dark:text-slate-100 light:text-slate-900',
  useAnimation = false
}) => {
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const { isDark } = useTheme();
  const uniqueId = useId().replace(/:/g, '');
  const purpleGradId = `cp-purple-${uniqueId}`;
  const pulseGradId = `cp-pulse-${uniqueId}`;

  const numSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 32;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* 1. If scanning/auditing animation is requested, render the uploaded logo animation mp4 */}
      {useAnimation && !videoError ? (
        <div 
          className="relative shrink-0 rounded-xl overflow-hidden flex items-center justify-center transition-all"
          style={{ 
            width: numSize, 
            height: Math.round(numSize * (532 / 690)) 
          }}
        >
          <video
            src="/logo-animation.mp4"
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            className={`w-full h-full object-contain transition-all duration-300 ${
              isDark 
                ? 'invert hue-rotate-180 mix-blend-screen' 
                : 'mix-blend-multiply'
            }`}
          />
        </div>
      ) : !imgError ? (
        /* 2. Render user's uploaded official PNG logo */
        <img
          src="/codepulse-logo.png"
          alt="CodePulse AI"
          width={numSize}
          height={numSize}
          onError={() => setImgError(true)}
          className="shrink-0 object-contain rounded-lg transition-transform duration-300 hover:scale-105 filter drop-shadow-sm"
          style={{ width: numSize, height: numSize }}
          loading="eager"
        />
      ) : (
        /* 3. High-precision vector SVG fallback */
        <svg
          width={numSize}
          height={numSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
          aria-label="CodePulse Logo"
        >
          <defs>
            <linearGradient id={purpleGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333EA" />
              <stop offset="40%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id={pulseGradId} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#00F0FF" />
            </linearGradient>
          </defs>

          {/* 'C' Letterform */}
          <path
            d="M 72 23 A 36 36 0 1 0 72 77 L 66 69 A 26 26 0 1 1 66 31 Z"
            fill={`url(#${purpleGradId})`}
          />
          <path
            d="M 72 23 L 80 23 A 36 36 0 0 1 85 36 L 75 39 A 26 26 0 0 0 72 23 Z"
            fill={`url(#${purpleGradId})`}
            opacity="0.9"
          />
          <path
            d="M 72 77 L 80 77 A 36 36 0 0 0 85 64 L 75 61 A 26 26 0 0 1 72 77 Z"
            fill={`url(#${purpleGradId})`}
            opacity="0.9"
          />

          {/* Center ECG Pulse Line */}
          <path
            d="M 10 50 L 26 50 L 30 46 L 34 53 L 40 40 L 46 22 L 54 78 L 62 30 L 69 62 L 76 44 L 82 50 L 92 50"
            stroke={`url(#${pulseGradId})`}
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="94" cy="50" r="2.2" fill="#00F0FF" />
        </svg>
      )}

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
          <span className="text-[9px] font-mono tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase">
            Neural Auditor
          </span>
        </div>
      )}
    </div>
  );
};
