import { CodeFile, AuditResult } from '../types';
import { normalizePath } from './diffUtils';

export interface MemoryOptimizationResult {
  optimizedFiles: CodeFile[];
  memoryFreedBytes: number;
  cleanFilesCount: number;
  retainedFilesCount: number;
  estimatedHeapFreedMb: string;
}

export interface MemoryOptimizationPreview {
  totalFiles: number;
  cleanFilesCount: number;
  issueFilesCount: number;
  totalMemoryBytes: number;
  memoryFreedBytes: number;
  estimatedHeapFreedMb: string;
  totalHeapMb: string;
  cleanFilesList: { name: string; path: string; size: number }[];
  issueFilesList: { name: string; path: string; issuesCount: number }[];
}

/**
 * Computes a preview of what will be optimized/retained without modifying any file buffers.
 */
export function previewMemoryOptimization(
  files: CodeFile[],
  auditResult: AuditResult | null,
  activeFilePath?: string
): MemoryOptimizationPreview {
  if (!auditResult || !files || files.length === 0) {
    return {
      totalFiles: files?.length || 0,
      cleanFilesCount: 0,
      issueFilesCount: files?.length || 0,
      totalMemoryBytes: 0,
      memoryFreedBytes: 0,
      estimatedHeapFreedMb: '0.00',
      totalHeapMb: '0.00',
      cleanFilesList: [],
      issueFilesList: []
    };
  }

  // Count issues per normalized file path
  const issueCounts = new Map<string, number>();

  if (auditResult.securityAudit && Array.isArray(auditResult.securityAudit)) {
    auditResult.securityAudit.forEach((sec) => {
      if (sec.filePath) {
        const norm = normalizePath(sec.filePath);
        issueCounts.set(norm, (issueCounts.get(norm) || 0) + 1);
      }
    });
  }

  if (auditResult.codeSmells && Array.isArray(auditResult.codeSmells)) {
    auditResult.codeSmells.forEach((smell) => {
      if (smell.filePath) {
        const norm = normalizePath(smell.filePath);
        issueCounts.set(norm, (issueCounts.get(norm) || 0) + 1);
      }
    });
  }

  const activeNorm = activeFilePath ? normalizePath(activeFilePath) : '';
  let totalMemoryBytes = 0;
  let memoryFreedBytes = 0;

  const cleanFilesList: { name: string; path: string; size: number }[] = [];
  const issueFilesList: { name: string; path: string; issuesCount: number }[] = [];

  files.forEach((file) => {
    const fileNorm = normalizePath(file.path || file.name);
    const contentLen = file.content?.length || 0;
    const fileMemory = contentLen * 2; // UTF-16 representation
    totalMemoryBytes += fileMemory;

    // Check if issues map has this file
    let issuesFound = issueCounts.get(fileNorm) || 0;
    if (issuesFound === 0) {
      // Fuzzy path match check
      for (const [path, count] of issueCounts.entries()) {
        if (path.endsWith(fileNorm) || fileNorm.endsWith(path) || path.includes(fileNorm) || fileNorm.includes(path)) {
          issuesFound += count;
        }
      }
    }

    const isActive = Boolean(activeNorm && (fileNorm === activeNorm || fileNorm.endsWith(activeNorm) || activeNorm.endsWith(fileNorm)));

    if (issuesFound > 0 || isActive) {
      issueFilesList.push({
        name: file.name,
        path: file.path || file.name,
        issuesCount: issuesFound
      });
    } else {
      cleanFilesList.push({
        name: file.name,
        path: file.path || file.name,
        size: file.size || contentLen
      });
      if (contentLen > 100) {
        memoryFreedBytes += fileMemory;
      }
    }
  });

  return {
    totalFiles: files.length,
    cleanFilesCount: cleanFilesList.length,
    issueFilesCount: issueFilesList.length,
    totalMemoryBytes,
    memoryFreedBytes,
    estimatedHeapFreedMb: (memoryFreedBytes / (1024 * 1024)).toFixed(2),
    totalHeapMb: (totalMemoryBytes / (1024 * 1024)).toFixed(2),
    cleanFilesList,
    issueFilesList
  };
}

/**
 * Prunes raw code string buffers for files with zero security findings and zero code smells,
 * preserving all metadata (id, name, path, language, size) and aggregate audit metrics.
 * Retains full content for files with security findings, code smells, or the active file.
 */
export function optimizeFileMemory(
  files: CodeFile[],
  auditResult: AuditResult | null,
  activeFilePath?: string
): MemoryOptimizationResult {
  if (!auditResult || !files || files.length === 0) {
    return {
      optimizedFiles: files || [],
      memoryFreedBytes: 0,
      cleanFilesCount: 0,
      retainedFilesCount: files?.length || 0,
      estimatedHeapFreedMb: '0.00'
    };
  }

  // Identify file paths that have issues
  const issueFilePaths = new Set<string>();

  if (auditResult.securityAudit && Array.isArray(auditResult.securityAudit)) {
    auditResult.securityAudit.forEach((sec) => {
      if (sec.filePath) {
        issueFilePaths.add(normalizePath(sec.filePath));
      }
    });
  }

  if (auditResult.codeSmells && Array.isArray(auditResult.codeSmells)) {
    auditResult.codeSmells.forEach((smell) => {
      if (smell.filePath) {
        issueFilePaths.add(normalizePath(smell.filePath));
      }
    });
  }

  const activeNorm = activeFilePath ? normalizePath(activeFilePath) : '';

  let memoryFreedBytes = 0;
  let cleanFilesCount = 0;
  let retainedFilesCount = 0;

  const optimizedFiles = files.map((file) => {
    const fileNorm = normalizePath(file.path || file.name);
    
    // Check if this file has findings or is currently active
    const hasIssue = 
      issueFilePaths.has(fileNorm) || 
      Array.from(issueFilePaths).some(p => p.endsWith(fileNorm) || fileNorm.endsWith(p) || p.includes(fileNorm) || fileNorm.includes(p));
    
    const isActive = activeNorm && (fileNorm === activeNorm || fileNorm.endsWith(activeNorm) || activeNorm.endsWith(fileNorm));

    if (hasIssue || isActive) {
      // Retain full code content for active files and files with findings
      retainedFilesCount += 1;
      return file;
    }

    // Clean file: release raw buffer, replace with lightweight verified stub
    const originalLen = file.content?.length || 0;
    if (originalLen > 100) {
      memoryFreedBytes += originalLen * 2; // JS UTF-16 string memory footprint
      cleanFilesCount += 1;
      return {
        ...file,
        content: `// [CodePulse Memory Optimization - Buffer Released]\n// File verified clean by Neural AST Engine (0 vulnerabilities, 0 code debt smells).\n// Full architectural topology, language telemetry, and aggregate metrics are preserved.\n// Content buffer released to maintain browser responsiveness.`
      };
    }

    retainedFilesCount += 1;
    return file;
  });

  const estimatedHeapFreedMb = (memoryFreedBytes / (1024 * 1024)).toFixed(2);

  return {
    optimizedFiles,
    memoryFreedBytes,
    cleanFilesCount,
    retainedFilesCount,
    estimatedHeapFreedMb
  };
}
