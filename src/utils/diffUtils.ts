import { CodeFile, AuditResult, SecurityFinding, CodeSmell } from '../types';

export enum DiffLineType {
  Unchanged = 'unchanged',
  Added = 'added',
  Deleted = 'deleted',
  Modified = 'modified'
}

export interface DiffLine {
  type: DiffLineType | 'unchanged' | 'added' | 'deleted' | 'modified';
  leftLineNum?: number;
  rightLineNum?: number;
  leftContent: string;
  rightContent: string;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
  totalChanges: number;
}

export interface FileSuggestion {
  id: string;
  type: 'security' | 'smell';
  title: string;
  badge: string;
  badgeColor: 'rose' | 'amber' | 'purple' | 'indigo' | 'emerald';
  originalSnippet: string;
  refactoredSnippet: string;
  lineStart: number;
  lineEnd: number;
  explanation: string;
  benefits?: string[];
}

/**
 * Normalizes file paths for robust matching across OS and relative prefixes
 */
export function normalizePath(pathStr: string): string {
  if (!pathStr) return '';
  return pathStr.replace(/^[./\\]+/, '').replace(/\\/g, '/').toLowerCase();
}

/**
 * Matches an audit item's filePath against a CodeFile
 */
export function matchesFile(itemFilePath: string, file: CodeFile): boolean {
  const normItem = normalizePath(itemFilePath);
  const normFile = normalizePath(file.path || file.name);
  const fileName = normalizePath(file.name);

  return (
    normItem === normFile ||
    normItem.endsWith(fileName) ||
    normFile.endsWith(normItem) ||
    normItem.includes(fileName) ||
    fileName.includes(normItem)
  );
}

/**
 * Extracts all security and refactoring suggestions that apply to a given file
 */
export function getFileSuggestions(file: CodeFile, auditResult: AuditResult | null): FileSuggestion[] {
  if (!auditResult || !file) return [];

  const suggestions: FileSuggestion[] = [];

  // 1. Security Findings
  if (auditResult.securityAudit) {
    auditResult.securityAudit.forEach((finding) => {
      if (matchesFile(finding.filePath, file)) {
        suggestions.push({
          id: finding.id,
          type: 'security',
          title: finding.title,
          badge: finding.severity,
          badgeColor: finding.severity === 'Critical' || finding.severity === 'High' ? 'rose' : 'amber',
          originalSnippet: finding.vulnerableCode,
          refactoredSnippet: finding.remediationCode,
          lineStart: finding.lineStart,
          lineEnd: finding.lineEnd,
          explanation: finding.description,
          benefits: finding.remediationSteps
        });
      }
    });
  }

  // 2. Code Smells / Refactorings
  if (auditResult.codeSmells) {
    auditResult.codeSmells.forEach((smell) => {
      if (matchesFile(smell.filePath, file)) {
        suggestions.push({
          id: smell.id,
          type: 'smell',
          title: smell.title,
          badge: smell.category,
          badgeColor: 'purple',
          originalSnippet: smell.snippet,
          refactoredSnippet: smell.refactoredCode,
          lineStart: smell.lineStart,
          lineEnd: smell.lineEnd,
          explanation: smell.explanation,
          benefits: smell.benefits
        });
      }
    });
  }

  return suggestions;
}

/**
 * Safe literal string replacement that does not evaluate regex meta-characters or
 * special pattern replacement sequences ($1, $&, $', etc.)
 */
function safeLiteralReplace(source: string, target: string, replacement: string): string {
  if (!target) return source;
  const idx = source.indexOf(target);
  if (idx === -1) return source;
  return source.slice(0, idx) + replacement + source.slice(idx + target.length);
}

/**
 * Generates the synthesized full refactored code for a file by applying
 * all matched security remediations and code smell refactorings.
 * Uses line-range slicing and literal index substitution to prevent string corruption
 * and accidental code injection.
 */
export function generateFullRefactoredCode(
  file: CodeFile,
  suggestions: FileSuggestion[]
): string {
  if (!suggestions || suggestions.length === 0) {
    return file.content;
  }

  // Clone suggestions and sort descending by lineStart to prevent line offset skew
  const sorted = [...suggestions].sort((a, b) => {
    const startA = a.lineStart || 0;
    const startB = b.lineStart || 0;
    return startB - startA;
  });

  let fileLines = file.content.split('\n');

  for (const item of sorted) {
    const orig = item.originalSnippet ? item.originalSnippet.trim() : '';
    const replacement = item.refactoredSnippet !== undefined ? item.refactoredSnippet : '';
    if (!orig && !replacement) continue;

    // 1. Line-range guided replacement if valid lines are present
    if (item.lineStart && item.lineStart > 0 && item.lineEnd && item.lineEnd >= item.lineStart) {
      const startIdx = item.lineStart - 1;
      const endIdx = Math.min(fileLines.length, item.lineEnd);
      const targetSlice = fileLines.slice(startIdx, endIdx).join('\n').trim();

      if (targetSlice.includes(orig) || orig.includes(targetSlice) || targetSlice.length === 0) {
        const replacementLines = replacement.split('\n');
        fileLines.splice(startIdx, endIdx - startIdx, ...replacementLines);
        continue;
      }
    }

    // 2. Exact or fuzzy search across file lines
    const currentText = fileLines.join('\n');
    if (orig && currentText.includes(orig)) {
      const updated = safeLiteralReplace(currentText, orig, replacement);
      fileLines = updated.split('\n');
      continue;
    }

    // 3. Normalized whitespace line-match fallback
    const origLines = orig.split('\n').map((l) => l.trim()).filter(Boolean);
    if (origLines.length > 0) {
      const firstLine = origLines[0];
      const matchIdx = fileLines.findIndex((l) => l.trim() === firstLine);
      if (matchIdx !== -1) {
        const matchedCount = Math.min(origLines.length, fileLines.length - matchIdx);
        const replacementLines = replacement.split('\n');
        fileLines.splice(matchIdx, matchedCount, ...replacementLines);
      }
    }
  }

  return fileLines.join('\n');
}

/**
 * Fast Longest Common Subsequence (LCS) line diff algorithm for side-by-side view.
 * Enhanced with common prefix/suffix trimming and O(N*M) memory protection guard.
 */
export function computeLineDiff(originalText: string, refactoredText: string): {
  diffLines: DiffLine[];
  stats: DiffStats;
} {
  const origLines = originalText.split('\n');
  const refactLines = refactoredText.split('\n');

  const n = origLines.length;
  const m = refactLines.length;

  // 1. Fast match if both texts are identical
  if (originalText === refactoredText) {
    return {
      diffLines: origLines.map((line, idx) => ({
        type: DiffLineType.Unchanged,
        leftLineNum: idx + 1,
        rightLineNum: idx + 1,
        leftContent: line,
        rightContent: line
      })),
      stats: { additions: 0, deletions: 0, modifications: 0, totalChanges: 0 }
    };
  }

  // 2. Strip common prefix to drastically minimize matrix dimensions
  let prefix = 0;
  while (prefix < n && prefix < m && origLines[prefix] === refactLines[prefix]) {
    prefix++;
  }

  // 3. Strip common suffix
  let suffix = 0;
  while (
    suffix < (n - prefix) &&
    suffix < (m - prefix) &&
    origLines[n - 1 - suffix] === refactLines[m - 1 - suffix]
  ) {
    suffix++;
  }

  const midOrig = origLines.slice(prefix, n - suffix);
  const midRefact = refactLines.slice(prefix, m - suffix);
  const midN = midOrig.length;
  const midM = midRefact.length;

  let midRawDiff: Array<{ type: 'same' | 'del' | 'add'; origIdx?: number; refactIdx?: number }> = [];

  // Memory & CPU Protection Guard: If middle slice matrix exceeds 1,000,000 cells,
  // fallback to linear greedy comparison to prevent browser OOM lockups.
  if (midN * midM > 1000000) {
    let p = 0;
    let q = 0;
    while (p < midN || q < midM) {
      if (p < midN && q < midM && midOrig[p] === midRefact[q]) {
        midRawDiff.push({ type: 'same', origIdx: prefix + p, refactIdx: prefix + q });
        p++;
        q++;
      } else if (p < midN && q < midM) {
        midRawDiff.push({ type: 'del', origIdx: prefix + p });
        midRawDiff.push({ type: 'add', refactIdx: prefix + q });
        p++;
        q++;
      } else if (p < midN) {
        midRawDiff.push({ type: 'del', origIdx: prefix + p });
        p++;
      } else {
        midRawDiff.push({ type: 'add', refactIdx: prefix + q });
        q++;
      }
    }
  } else if (midN > 0 || midM > 0) {
    // Standard LCS on trimmed middle slice
    const dp: number[][] = Array.from({ length: midN + 1 }, () => new Array(midM + 1).fill(0));

    for (let i = 1; i <= midN; i++) {
      for (let j = 1; j <= midM; j++) {
        if (midOrig[i - 1] === midRefact[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const sliceDiff: Array<{ type: 'same' | 'del' | 'add'; origIdx?: number; refactIdx?: number }> = [];
    let i = midN;
    let j = midM;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && midOrig[i - 1] === midRefact[j - 1]) {
        sliceDiff.push({ type: 'same', origIdx: prefix + i - 1, refactIdx: prefix + j - 1 });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        sliceDiff.push({ type: 'add', refactIdx: prefix + j - 1 });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        sliceDiff.push({ type: 'del', origIdx: prefix + i - 1 });
        i--;
      }
    }
    midRawDiff = sliceDiff.reverse();
  }

  // Combine prefix + mid + suffix into full rawDiff sequence
  const rawDiff: Array<{ type: 'same' | 'del' | 'add'; origIdx?: number; refactIdx?: number }> = [];

  for (let k = 0; k < prefix; k++) {
    rawDiff.push({ type: 'same', origIdx: k, refactIdx: k });
  }

  for (const item of midRawDiff) {
    rawDiff.push(item);
  }

  for (let k = 0; k < suffix; k++) {
    const oIdx = n - suffix + k;
    const rIdx = m - suffix + k;
    rawDiff.push({ type: 'same', origIdx: oIdx, refactIdx: rIdx });
  }

  // Consolidate into paired side-by-side rows
  const diffLines: DiffLine[] = [];
  let stats: DiffStats = { additions: 0, deletions: 0, modifications: 0, totalChanges: 0 };

  let k = 0;
  while (k < rawDiff.length) {
    const entry = rawDiff[k];

    if (entry.type === 'same') {
      diffLines.push({
        type: DiffLineType.Unchanged,
        leftLineNum: entry.origIdx! + 1,
        rightLineNum: entry.refactIdx! + 1,
        leftContent: origLines[entry.origIdx!],
        rightContent: refactLines[entry.refactIdx!]
      });
      k++;
    } else if (entry.type === 'del') {
      // Check if immediately followed by an 'add' (which means a modification block)
      if (k + 1 < rawDiff.length && rawDiff[k + 1].type === 'add') {
        const nextEntry = rawDiff[k + 1];
        diffLines.push({
          type: DiffLineType.Modified,
          leftLineNum: entry.origIdx! + 1,
          rightLineNum: nextEntry.refactIdx! + 1,
          leftContent: origLines[entry.origIdx!],
          rightContent: refactLines[nextEntry.refactIdx!]
        });
        stats.modifications++;
        stats.totalChanges++;
        k += 2;
      } else {
        diffLines.push({
          type: DiffLineType.Deleted,
          leftLineNum: entry.origIdx! + 1,
          rightLineNum: undefined,
          leftContent: origLines[entry.origIdx!],
          rightContent: ''
        });
        stats.deletions++;
        stats.totalChanges++;
        k++;
      }
    } else if (entry.type === 'add') {
      diffLines.push({
        type: DiffLineType.Added,
        leftLineNum: undefined,
        rightLineNum: entry.refactIdx! + 1,
        leftContent: '',
        rightContent: refactLines[entry.refactIdx!]
      });
      stats.additions++;
      stats.totalChanges++;
      k++;
    }
  }

  return { diffLines, stats };
}
