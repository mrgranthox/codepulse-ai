import { CodeFile, AuditResult, SecurityFinding, CodeSmell } from '../types';

export interface DiffLine {
  type: 'unchanged' | 'added' | 'deleted' | 'modified';
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
 * Generates the synthesized full refactored code for a file by applying
 * all matched security remediations and code smell refactorings.
 */
export function generateFullRefactoredCode(
  file: CodeFile,
  suggestions: FileSuggestion[]
): string {
  let content = file.content;
  if (!suggestions || suggestions.length === 0) {
    return content;
  }

  // Apply suggestions in sequence
  for (const item of suggestions) {
    const orig = item.originalSnippet.trim();
    const replacement = item.refactoredSnippet.trim();

    if (!orig || !replacement) continue;

    if (content.includes(orig)) {
      content = content.replace(orig, replacement);
    } else {
      // Fuzzy line matching if exact string has slight whitespace differences
      const origLines = orig.split('\n').map((l) => l.trim()).filter(Boolean);
      if (origLines.length > 0) {
        const firstLine = origLines[0];
        const contentLines = content.split('\n');
        const matchIdx = contentLines.findIndex((l) => l.trim() === firstLine);
        if (matchIdx !== -1) {
          // Replace chunk
          const matchedCount = Math.min(origLines.length, contentLines.length - matchIdx);
          contentLines.splice(matchIdx, matchedCount, replacement);
          content = contentLines.join('\n');
        }
      }
    }
  }

  return content;
}

/**
 * Fast Longest Common Subsequence (LCS) line diff algorithm for side-by-side view.
 */
export function computeLineDiff(originalText: string, refactoredText: string): {
  diffLines: DiffLine[];
  stats: DiffStats;
} {
  const origLines = originalText.split('\n');
  const refactLines = refactoredText.split('\n');

  const n = origLines.length;
  const m = refactLines.length;

  // Build LCS matrix
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (origLines[i - 1] === refactLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to assemble diff entries
  const rawDiff: Array<{ type: 'same' | 'del' | 'add'; origIdx?: number; refactIdx?: number }> = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === refactLines[j - 1]) {
      rawDiff.push({ type: 'same', origIdx: i - 1, refactIdx: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({ type: 'add', refactIdx: j - 1 });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({ type: 'del', origIdx: i - 1 });
      i--;
    }
  }

  rawDiff.reverse();

  // Consolidate into paired side-by-side rows
  const diffLines: DiffLine[] = [];
  let stats: DiffStats = { additions: 0, deletions: 0, modifications: 0, totalChanges: 0 };

  let k = 0;
  while (k < rawDiff.length) {
    const entry = rawDiff[k];

    if (entry.type === 'same') {
      diffLines.push({
        type: 'unchanged',
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
          type: 'modified',
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
          type: 'deleted',
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
        type: 'added',
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
