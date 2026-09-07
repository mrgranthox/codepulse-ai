import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Copy, 
  Zap, 
  Layers, 
  AlertCircle, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode2, 
  FileCode, 
  TrendingUp, 
  SplitSquareVertical, 
  Columns2, 
  Code, 
  Folder, 
  FolderOpen, 
  Search, 
  Filter, 
  ShieldAlert, 
  Shield, 
  Download, 
  ChevronRight, 
  ChevronDown, 
  ChevronLeft, 
  Terminal, 
  Sliders, 
  Maximize2, 
  Minimize2, 
  Edit3, 
  Eye, 
  X, 
  FileText, 
  FileCheck2, 
  Hash, 
  Play, 
  Save, 
  RotateCcw, 
  Bug, 
  Info,
  Grid,
  ExternalLink
} from 'lucide-react';
import { NativeCodeEditor } from './NativeCodeEditor';
import { CodeSmell, SecurityFinding, CodeFile, AuditResult, ActiveTab } from '../types';
import { StorylineFooter } from './StorylineFooter';
import { PaginationControls } from './PaginationControls';
import { getFileSuggestions, generateFullRefactoredCode, matchesFile, normalizePath, FileSuggestion } from '../utils/diffUtils';

interface RefactoringViewProps {
  smells?: CodeSmell[];
  securityFindings?: SecurityFinding[];
  files?: CodeFile[];
  auditResult?: AuditResult | null;
  onNavigate?: (tab: ActiveTab) => void;
  onUpdateFileContent?: (filePath: string, newContent: string) => void;
}

interface EnrichedFileItem {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  securityFindings: SecurityFinding[];
  smells: CodeSmell[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalSecurity: number;
  totalSmells: number;
  totalIssues: number;
  hasSecurity: boolean;
  hasSmells: boolean;
}

export const RefactoringView: React.FC<RefactoringViewProps> = ({ 
  smells = [], 
  securityFindings = [], 
  files = [], 
  auditResult = null,
  onNavigate,
  onUpdateFileContent
}) => {
  // Top-level View Mode: 'studio' (Interactive Monaco IDE & AST Diffs) vs 'catalog' (Full 100+ Refactoring Matrix & Grid)
  const [activeViewMode, setActiveViewMode] = useState<'studio' | 'catalog'>('studio');

  // 1. Enrich & Consolidate All Files
  const enrichedFiles = useMemo<EnrichedFileItem[]>(() => {
    const fileMap = new Map<string, EnrichedFileItem>();

    const detectLang = (pathStr: string): string => {
      const ext = pathStr.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'py': return 'python';
        case 'js': case 'jsx': case 'mjs': return 'javascript';
        case 'ts': case 'tsx': return 'typescript';
        case 'go': return 'go';
        case 'rs': return 'rust';
        case 'java': return 'java';
        case 'json': return 'json';
        case 'sql': return 'sql';
        case 'yaml': case 'yml': return 'yaml';
        case 'html': return 'html';
        case 'css': return 'css';
        default: return 'typescript';
      }
    };

    // Add provided files
    files.forEach((f) => {
      const key = normalizePath(f.path || f.name);
      fileMap.set(key, {
        id: f.id || key,
        name: f.name || f.path.split('/').pop() || 'file',
        path: f.path || f.name,
        language: f.language || detectLang(f.path || f.name),
        content: f.content || '',
        securityFindings: [],
        smells: [],
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        totalSecurity: 0,
        totalSmells: 0,
        totalIssues: 0,
        hasSecurity: false,
        hasSmells: false
      });
    });

    // Populate security findings
    securityFindings.forEach((sec) => {
      const secKey = normalizePath(sec.filePath);
      let targetItem = fileMap.get(secKey);

      if (!targetItem) {
        for (const [, item] of fileMap.entries()) {
          if (matchesFile(sec.filePath, { id: item.id, name: item.name, path: item.path, language: item.language, content: item.content, size: 0 })) {
            targetItem = item;
            break;
          }
        }
      }

      if (!targetItem) {
        const fileName = sec.filePath.split('/').pop() || sec.filePath;
        targetItem = {
          id: `sec-file-${secKey}`,
          name: fileName,
          path: sec.filePath,
          language: detectLang(sec.filePath),
          content: sec.vulnerableCode || '// Source code snippet\n',
          securityFindings: [],
          smells: [],
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          totalSecurity: 0,
          totalSmells: 0,
          totalIssues: 0,
          hasSecurity: false,
          hasSmells: false
        };
        fileMap.set(secKey, targetItem);
      }

      targetItem.securityFindings.push(sec);
      targetItem.totalSecurity += 1;
      targetItem.totalIssues += 1;
      targetItem.hasSecurity = true;

      const sev = sec.severity?.toLowerCase();
      if (sev === 'critical') targetItem.criticalCount += 1;
      else if (sev === 'high') targetItem.highCount += 1;
      else if (sev === 'medium') targetItem.mediumCount += 1;
      else targetItem.lowCount += 1;
    });

    // Populate code smells
    smells.forEach((smell) => {
      const smellKey = normalizePath(smell.filePath);
      let targetItem = fileMap.get(smellKey);

      if (!targetItem) {
        for (const [, item] of fileMap.entries()) {
          if (matchesFile(smell.filePath, { id: item.id, name: item.name, path: item.path, language: item.language, content: item.content, size: 0 })) {
            targetItem = item;
            break;
          }
        }
      }

      if (!targetItem) {
        const fileName = smell.filePath.split('/').pop() || smell.filePath;
        targetItem = {
          id: `smell-file-${smellKey}`,
          name: fileName,
          path: smell.filePath,
          language: detectLang(smell.filePath),
          content: smell.snippet || '// Source code snippet\n',
          securityFindings: [],
          smells: [],
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          totalSecurity: 0,
          totalSmells: 0,
          totalIssues: 0,
          hasSecurity: false,
          hasSmells: false
        };
        fileMap.set(smellKey, targetItem);
      }

      targetItem.smells.push(smell);
      targetItem.totalSmells += 1;
      targetItem.totalIssues += 1;
      targetItem.hasSmells = true;

      const sev = smell.severity?.toLowerCase();
      if (sev === 'high') targetItem.highCount += 1;
      else if (sev === 'medium') targetItem.mediumCount += 1;
      else targetItem.lowCount += 1;
    });

    return Array.from(fileMap.values());
  }, [files, securityFindings, smells]);

  // Active file selection and editor tabs
  const [activeFilePath, setActiveFilePath] = useState<string>(() => {
    return enrichedFiles.find((f) => f.totalIssues > 0)?.path || enrichedFiles[0]?.path || '';
  });
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    return activeFilePath ? [activeFilePath] : [];
  });

  useEffect(() => {
    if (openTabs.length === 0 && enrichedFiles.length > 0) {
      const first = enrichedFiles.find((f) => f.totalIssues > 0)?.path || enrichedFiles[0]?.path;
      if (first) {
        setOpenTabs([first]);
        setActiveFilePath(first);
      }
    }
  }, [enrichedFiles, openTabs]);

  const activeFileItem = useMemo(() => {
    const norm = normalizePath(activeFilePath);
    return enrichedFiles.find((f) => normalizePath(f.path) === norm) || enrichedFiles[0] || null;
  }, [activeFilePath, enrichedFiles]);

  // Studio Explorer states
  const [explorerFilter, setExplorerFilter] = useState<'all' | 'issues-only' | 'security-only' | 'smells-only'>('issues-only');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFileTrees, setExpandedFileTrees] = useState<Record<string, boolean>>({});
  const [explorerPage, setExplorerPage] = useState<number>(1);
  const [explorerPageSize, setExplorerPageSize] = useState<number | 'All'>(10);

  // Active issue selection in active file
  const [selectedIssueId, setSelectedIssueId] = useState<string>('all');

  // Editor View Modes & Settings
  const [editorMode, setEditorMode] = useState<'side-by-side' | 'inline' | 'patched' | 'original'>('side-by-side');
  const [fontSize, setFontSize] = useState<number>(13);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [showMinimap, setShowMinimap] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Bottom Diagnostic Drawer State
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState<boolean>(true);
  const [activeBottomTab, setActiveBottomTab] = useState<'problems' | 'remediation' | 'distillation'>('problems');
  const [problemScope, setProblemScope] = useState<'active-file' | 'all-files'>('active-file');

  // Drawer Problems Pagination States
  const [activeFileProblemsPage, setActiveFileProblemsPage] = useState<number>(1);
  const [activeFileProblemsPageSize, setActiveFileProblemsPageSize] = useState<number | 'All'>(5);
  const [allFilesProblemsPage, setAllFilesProblemsPage] = useState<number>(1);
  const [allFilesProblemsPageSize, setAllFilesProblemsPageSize] = useState<number | 'All'>(10);
  const [allFilesFilterType, setAllFilesFilterType] = useState<'all' | 'security' | 'smells'>('all');
  const [allFilesSearch, setAllFilesSearch] = useState<string>('');

  // Catalog View States
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<'all' | 'smells' | 'security'>('all');
  const [catalogCategory, setCatalogCategory] = useState<string>('All');
  const [catalogSeverity, setCatalogSeverity] = useState<string>('All');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [catalogPageSize, setCatalogPageSize] = useState<number | 'All'>(12);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy & Action Feedback Toasts
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Toggle file tree item expansion
  const toggleFileExpansion = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFileTrees((prev) => ({ ...prev, [filePath]: !prev[filePath] }));
  };

  // Open file in editor
  const handleOpenFile = (filePath: string, targetIssueId?: string) => {
    setActiveFilePath(filePath);
    if (!openTabs.includes(filePath)) {
      setOpenTabs((prev) => [...prev, filePath]);
    }
    if (targetIssueId) {
      setSelectedIssueId(targetIssueId);
    } else {
      setSelectedIssueId('all');
    }
    setActiveViewMode('studio');
  };

  // Close tab
  const handleCloseTab = (tabPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((p) => p !== tabPath);
    setOpenTabs(newTabs);
    if (activeFilePath === tabPath && newTabs.length > 0) {
      setActiveFilePath(newTabs[newTabs.length - 1]);
    }
  };

  // Compute file suggestions and full refactored code for active file
  const activeFileSuggestions = useMemo<FileSuggestion[]>(() => {
    if (!activeFileItem) return [];
    return getFileSuggestions(
      {
        id: activeFileItem.id,
        name: activeFileItem.name,
        path: activeFileItem.path,
        language: activeFileItem.language,
        content: activeFileItem.content,
        size: activeFileItem.content.length
      },
      auditResult
    );
  }, [activeFileItem, auditResult]);

  // Compute all suggestions across all workspace files
  const allWorkspaceSuggestions = useMemo<{ file: EnrichedFileItem; suggestion: FileSuggestion }[]>(() => {
    const list: { file: EnrichedFileItem; suggestion: FileSuggestion }[] = [];
    enrichedFiles.forEach((f) => {
      const sugs = getFileSuggestions(
        {
          id: f.id,
          name: f.name,
          path: f.path,
          language: f.language,
          content: f.content,
          size: f.content.length
        },
        auditResult
      );
      sugs.forEach((s) => list.push({ file: f, suggestion: s }));
    });
    return list;
  }, [enrichedFiles, auditResult]);

  // Combined full refactored code for active file
  const fullRefactoredCode = useMemo<string>(() => {
    if (!activeFileItem) return '';
    return generateFullRefactoredCode(
      {
        id: activeFileItem.id,
        name: activeFileItem.name,
        path: activeFileItem.path,
        language: activeFileItem.language,
        content: activeFileItem.content,
        size: activeFileItem.content.length
      },
      activeFileSuggestions
    );
  }, [activeFileItem, activeFileSuggestions]);

  // Current active suggestion
  const currentSuggestion = useMemo(() => {
    if (selectedIssueId === 'all') return null;
    return activeFileSuggestions.find((s) => s.id === selectedIssueId) || null;
  }, [selectedIssueId, activeFileSuggestions]);

  // Code strings for Monaco
  const { monacoOriginal, monacoModified } = useMemo(() => {
    if (!activeFileItem) return { monacoOriginal: '', monacoModified: '' };

    if (currentSuggestion) {
      return {
        monacoOriginal: currentSuggestion.originalSnippet || activeFileItem.content,
        monacoModified: currentSuggestion.refactoredSnippet || fullRefactoredCode
      };
    }

    return {
      monacoOriginal: activeFileItem.content || '// Original source code',
      monacoModified: fullRefactoredCode || activeFileItem.content
    };
  }, [activeFileItem, currentSuggestion, fullRefactoredCode]);

  // Copy handler
  const handleCopy = (code: string, label = 'Copied to clipboard', id?: string) => {
    navigator.clipboard.writeText(code);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    setCopiedStatus(label);
    setTimeout(() => setCopiedStatus(null), 2500);
  };

  // Apply patch handler with intelligent snippet replacement
  const handleApplyPatch = (targetPath?: string, targetCode?: string, originalSnippet?: string) => {
    const filePath = targetPath || activeFileItem?.path;
    if (!filePath) return;

    let codeToApply: string;
    if (originalSnippet && targetCode) {
      const file = files.find((f) => f.path === filePath || f.name === filePath);
      if (file && file.content && file.content.includes(originalSnippet)) {
        codeToApply = file.content.replace(originalSnippet, targetCode);
      } else {
        codeToApply = targetCode;
      }
    } else {
      codeToApply = targetCode || fullRefactoredCode;
    }

    if (!codeToApply) return;

    if (onUpdateFileContent) {
      onUpdateFileContent(filePath, codeToApply);
    }
    const fileName = filePath.split('/').pop() || filePath;
    setAppliedToast(`Applied patch to ${fileName}`);
    setTimeout(() => setAppliedToast(null), 3000);
  };

  // Download patched file
  const handleDownloadPatchedFile = () => {
    if (!activeFileItem) return;
    const blob = new Blob([fullRefactoredCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `remediated-${activeFileItem.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Step between issues in active file
  const handleStepIssue = (direction: 'next' | 'prev') => {
    if (activeFileSuggestions.length === 0) return;
    const ids = ['all', ...activeFileSuggestions.map((s) => s.id)];
    const currentIndex = ids.indexOf(selectedIssueId);
    let nextIndex = 0;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % ids.length;
    } else {
      nextIndex = (currentIndex - 1 + ids.length) % ids.length;
    }
    setSelectedIssueId(ids[nextIndex]);
  };

  // Filtered files for explorer sidebar
  const filteredExplorerFiles = useMemo(() => {
    return enrichedFiles.filter((f) => {
      if (explorerFilter === 'issues-only' && f.totalIssues === 0) return false;
      if (explorerFilter === 'security-only' && !f.hasSecurity) return false;
      if (explorerFilter === 'smells-only' && !f.hasSmells) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q);
        const matchSec = f.securityFindings.some((s) => s.title.toLowerCase().includes(q) || s.owaspCategory.toLowerCase().includes(q));
        const matchSmell = f.smells.some((s) => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
        return matchName || matchSec || matchSmell;
      }

      return true;
    });
  }, [enrichedFiles, explorerFilter, searchQuery]);

  // Paginated files for explorer sidebar
  const explorerTotalPages = useMemo(() => {
    if (explorerPageSize === 'All') return 1;
    return Math.max(1, Math.ceil(filteredExplorerFiles.length / explorerPageSize));
  }, [filteredExplorerFiles.length, explorerPageSize]);

  const paginatedExplorerFiles = useMemo(() => {
    if (explorerPageSize === 'All') return filteredExplorerFiles;
    const start = (explorerPage - 1) * explorerPageSize;
    return filteredExplorerFiles.slice(start, start + explorerPageSize);
  }, [filteredExplorerFiles, explorerPage, explorerPageSize]);

  // Drawer Problems pagination
  const activeFileProblemsTotalPages = useMemo(() => {
    if (activeFileProblemsPageSize === 'All') return 1;
    return Math.max(1, Math.ceil(activeFileSuggestions.length / activeFileProblemsPageSize));
  }, [activeFileSuggestions.length, activeFileProblemsPageSize]);

  const paginatedActiveFileSuggestions = useMemo(() => {
    if (activeFileProblemsPageSize === 'All') return activeFileSuggestions;
    const start = (activeFileProblemsPage - 1) * activeFileProblemsPageSize;
    return activeFileSuggestions.slice(start, start + activeFileProblemsPageSize);
  }, [activeFileSuggestions, activeFileProblemsPage, activeFileProblemsPageSize]);

  // All workspace suggestions filtered
  const filteredAllWorkspaceSuggestions = useMemo(() => {
    return allWorkspaceSuggestions.filter(({ file, suggestion }) => {
      if (allFilesFilterType === 'security' && suggestion.type !== 'security') return false;
      if (allFilesFilterType === 'smells' && suggestion.type !== 'smell') return false;
      if (allFilesSearch.trim()) {
        const q = allFilesSearch.toLowerCase();
        const matchTitle = suggestion.title.toLowerCase().includes(q);
        const matchExpl = suggestion.explanation.toLowerCase().includes(q);
        const matchFile = file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q);
        return matchTitle || matchExpl || matchFile;
      }
      return true;
    });
  }, [allWorkspaceSuggestions, allFilesFilterType, allFilesSearch]);

  const allFilesProblemsTotalPages = useMemo(() => {
    if (allFilesProblemsPageSize === 'All') return 1;
    return Math.max(1, Math.ceil(filteredAllWorkspaceSuggestions.length / allFilesProblemsPageSize));
  }, [filteredAllWorkspaceSuggestions.length, allFilesProblemsPageSize]);

  const paginatedAllWorkspaceSuggestions = useMemo(() => {
    if (allFilesProblemsPageSize === 'All') return filteredAllWorkspaceSuggestions;
    const start = (allFilesProblemsPage - 1) * allFilesProblemsPageSize;
    return filteredAllWorkspaceSuggestions.slice(start, start + allFilesProblemsPageSize);
  }, [filteredAllWorkspaceSuggestions, allFilesProblemsPage, allFilesProblemsPageSize]);

  // ==========================================
  // 2. UNIFIED CATALOG OF ALL 100+ REFACTORINGS
  // ==========================================
  const allCatalogRefactors = useMemo(() => {
    const list: {
      id: string;
      title: string;
      category: string;
      severity: 'Critical' | 'High' | 'Medium' | 'Low';
      filePath: string;
      lineStart: number;
      lineEnd: number;
      explanation: string;
      originalSnippet: string;
      refactoredSnippet: string;
      benefits: string[];
      type: 'smell' | 'security';
    }[] = [];

    // Add all code smells
    smells.forEach((s) => {
      list.push({
        id: s.id,
        title: s.title,
        category: s.category || 'Anti-Pattern',
        severity: s.severity || 'Medium',
        filePath: s.filePath,
        lineStart: s.lineStart,
        lineEnd: s.lineEnd,
        explanation: s.explanation,
        originalSnippet: s.snippet,
        refactoredSnippet: s.refactoredCode,
        benefits: s.benefits || ['Improves readability', 'Eliminates technical debt'],
        type: 'smell'
      });
    });

    // Add all security findings as actionable refactoring patches
    securityFindings.forEach((sf) => {
      list.push({
        id: sf.id,
        title: sf.title,
        category: sf.owaspCategory || 'Security Remediations',
        severity: sf.severity || 'High',
        filePath: sf.filePath,
        lineStart: sf.lineStart,
        lineEnd: sf.lineEnd,
        explanation: sf.description,
        originalSnippet: sf.vulnerableCode,
        refactoredSnippet: sf.remediationCode,
        benefits: sf.remediationSteps || ['Hardens OWASP attack surface', 'Validates inputs strictly'],
        type: 'security'
      });
    });

    return list;
  }, [smells, securityFindings]);

  // Unique categories in catalog with counts
  const catalogCategories = useMemo(() => {
    const map = new Map<string, number>();
    allCatalogRefactors.forEach((r) => {
      const cat = r.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  }, [allCatalogRefactors]);

  // Filtered catalog items
  const filteredCatalogRefactors = useMemo(() => {
    return allCatalogRefactors.filter((item) => {
      const matchesType =
        catalogTypeFilter === 'all' ||
        (catalogTypeFilter === 'smells' && item.type === 'smell') ||
        (catalogTypeFilter === 'security' && item.type === 'security');

      const matchesCategory =
        catalogCategory === 'All' || item.category.toLowerCase() === catalogCategory.toLowerCase();
      
      const matchesSeverity =
        catalogSeverity === 'All' || item.severity.toLowerCase() === catalogSeverity.toLowerCase();

      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesExpl = item.explanation.toLowerCase().includes(q);
        const matchesPath = item.filePath.toLowerCase().includes(q);
        const matchesCode =
          item.originalSnippet.toLowerCase().includes(q) ||
          item.refactoredSnippet.toLowerCase().includes(q);

        return matchesType && matchesCategory && matchesSeverity && (matchesTitle || matchesExpl || matchesPath || matchesCode);
      }

      return matchesType && matchesCategory && matchesSeverity;
    });
  }, [allCatalogRefactors, catalogTypeFilter, catalogCategory, catalogSeverity, catalogSearch]);

  // Catalog total pages
  const catalogTotalPages = useMemo(() => {
    if (catalogPageSize === 'All') return 1;
    return Math.max(1, Math.ceil(filteredCatalogRefactors.length / catalogPageSize));
  }, [filteredCatalogRefactors.length, catalogPageSize]);

  // Paginated catalog items
  const paginatedCatalogRefactors = useMemo(() => {
    if (catalogPageSize === 'All') return filteredCatalogRefactors;
    const start = (catalogPage - 1) * catalogPageSize;
    return filteredCatalogRefactors.slice(start, start + catalogPageSize);
  }, [filteredCatalogRefactors, catalogPage, catalogPageSize]);

  // Reset catalog page on filter change
  useEffect(() => {
    setCatalogPage(1);
  }, [catalogTypeFilter, catalogCategory, catalogSeverity, catalogSearch, catalogPageSize]);

  const getLanguagePill = (lang: string) => {
    const l = lang.toLowerCase();
    if (l.includes('ts') || l.includes('typescript')) {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">TS</span>;
    }
    if (l.includes('js') || l.includes('javascript')) {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">JS</span>;
    }
    if (l.includes('py') || l.includes('python')) {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PY</span>;
    }
    if (l.includes('go')) {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">GO</span>;
    }
    if (l.includes('rs') || l.includes('rust')) {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">RS</span>;
    }
    if (l.includes('sql')) {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">SQL</span>;
    }
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{lang.slice(0, 3).toUpperCase()}</span>;
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30';
      case 'medium':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'low':
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Code Refactoring & Security Patch Studio
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Live AST Diff Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive code editor, side-by-side AST diffs, and paginated catalog for 100+ automated refactorings
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Studio Diff vs Catalog Grid) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveViewMode('studio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeViewMode === 'studio'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>IDE Diff Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeViewMode === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Refactoring Catalog ({allCatalogRefactors.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleApplyPatch()}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply AI Patch to Active File</span>
          </button>
        </div>
      </div>

      {/* Applied Toast */}
      {appliedToast && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{appliedToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW MODE A: FULL 100+ REFACTORINGS CATALOG WITH PAGINATION            */}
      {/* ========================================================================= */}
      {activeViewMode === 'catalog' && (
        <div className="space-y-4">
          {/* Controls & Category Filter Header */}
          <div className="flex flex-col gap-4 p-5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Code Smells & Security Remediations Catalog</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Browse and apply all {allCatalogRefactors.length} automated patches ({smells.length} Code Quality Smells + {securityFindings.length} Security Fixes)
                </p>
              </div>

              {/* Severity Pills */}
              <div className="flex items-center space-x-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => {
                  const count = sev === 'All' 
                    ? allCatalogRefactors.length 
                    : allCatalogRefactors.filter((r) => r.severity.toLowerCase() === sev.toLowerCase()).length;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setCatalogSeverity(sev)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                        catalogSeverity === sev
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{sev}</span>
                      <span className="ml-1 text-[10px] font-mono opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type & Category Selection Rows */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-800">
              {/* Primary Type Selector */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Patch Type:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCatalogTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    catalogTypeFilter === 'all'
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/30 ring-1 ring-indigo-400/30'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  All Automated Patches ({allCatalogRefactors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTypeFilter('smells')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    catalogTypeFilter === 'smells'
                      ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-900/30 ring-1 ring-purple-400/30'
                      : 'bg-slate-950 text-purple-300 hover:text-purple-200 border border-purple-900/40'
                  }`}
                >
                  Code Quality & Debt Smells ({smells.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTypeFilter('security')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    catalogTypeFilter === 'security'
                      ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-900/30 ring-1 ring-rose-400/30'
                      : 'bg-slate-950 text-rose-300 hover:text-rose-200 border border-rose-900/40'
                  }`}
                >
                  Security Vulnerability Fixes ({securityFindings.length})
                </button>
              </div>

              {/* Category selector */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Category:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setCatalogCategory('All')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    catalogCategory === 'All'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  All Categories ({allCatalogRefactors.length})
                </button>

                {catalogCategories.map(({ category, count }) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCatalogCategory(category)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      catalogCategory === category
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>{category}</span>
                    <span className="ml-1 text-[10px] font-mono opacity-75">({count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search and results info */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search refactorings by name, explanation, file path, or code snippet..."
                className="w-full bg-[#020617] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
          </div>

          {/* Top Pagination Bar */}
          {filteredCatalogRefactors.length > 0 && catalogTotalPages > 1 && (
            <PaginationControls
              currentPage={catalogPage}
              totalPages={catalogTotalPages}
              totalItems={filteredCatalogRefactors.length}
              pageSize={catalogPageSize}
              pageSizeOptions={[6, 12, 24, 48, 100, 'All']}
              onPageChange={setCatalogPage}
              onPageSizeChange={setCatalogPageSize}
              itemLabel="refactorings"
              compact={true}
            />
          )}

          {/* Refactorings Grid List */}
          {filteredCatalogRefactors.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">No Refactorings Match Filters</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try clearing or resetting search query or category filters to browse all refactorings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {paginatedCatalogRefactors.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between transition-all"
                >
                  {/* Card Header */}
                  <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getSeverityBadgeClass(item.severity)}`}>
                          {item.severity}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.type === 'security'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {item.category}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.id}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white tracking-tight truncate">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-mono text-indigo-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{item.filePath.split('/').pop()}:L{item.lineStart}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3 flex-1">
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {item.explanation}
                    </p>

                    {/* Side-by-side or mini diff preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                      {/* Before */}
                      <div className="rounded-lg overflow-hidden border border-rose-900/40 bg-[#070104]">
                        <div className="px-2.5 py-1 bg-rose-950/60 border-b border-rose-900/40 text-[10px] font-semibold text-rose-300 flex items-center justify-between">
                          <span>Original (Smell/Flaw)</span>
                          <span>Lines {item.lineStart}-{item.lineEnd}</span>
                        </div>
                        <pre className="p-2.5 text-rose-200 overflow-x-auto max-h-36 whitespace-pre leading-snug">
                          {item.originalSnippet}
                        </pre>
                      </div>

                      {/* After */}
                      <div className="rounded-lg overflow-hidden border border-emerald-900/40 bg-[#010804]">
                        <div className="px-2.5 py-1 bg-emerald-950/60 border-b border-emerald-900/40 text-[10px] font-semibold text-emerald-300 flex items-center justify-between">
                          <span>Refactored Production Hardening</span>
                          <span>Clean AST</span>
                        </div>
                        <pre className="p-2.5 text-emerald-200 overflow-x-auto max-h-36 whitespace-pre leading-snug">
                          {item.refactoredSnippet}
                        </pre>
                      </div>
                    </div>

                    {/* Hardening Checklist */}
                    {item.benefits && item.benefits.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Architectural Impact:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.benefits.map((b, bIdx) => (
                            <span key={bIdx} className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>{b}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenFile(item.filePath, item.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-900/50 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in IDE Studio Diff</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.refactoredSnippet, 'Refactored code copied', item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy Refactored Code"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === item.id ? 'Copied' : 'Copy Code'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyPatch(item.filePath, item.refactoredSnippet, item.originalSnippet)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Apply Refactoring"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Patch</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Full Pagination Controls */}
          {filteredCatalogRefactors.length > 0 && (
            <PaginationControls
              currentPage={catalogPage}
              totalPages={catalogTotalPages}
              totalItems={filteredCatalogRefactors.length}
              pageSize={catalogPageSize}
              pageSizeOptions={[6, 12, 24, 48, 100, 'All']}
              onPageChange={setCatalogPage}
              onPageSizeChange={setCatalogPageSize}
              itemLabel="refactorings"
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW MODE B: INTERACTIVE MONACO IDE DIFF STUDIO                        */}
      {/* ========================================================================= */}
      {activeViewMode === 'studio' && (
        <div className="bg-[#020617] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[740px]">
          {/* Editor Main Top Bar */}
          <div className="h-10 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                  isSidebarOpen ? 'text-indigo-400 bg-slate-800/60' : 'text-slate-400'
                }`}
                title={isSidebarOpen ? 'Hide File Explorer Sidebar' : 'Show File Explorer Sidebar'}
              >
                <Folder className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span>CodePulse Studio</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400 text-[11px] font-mono">{activeFileItem?.path || 'workspace'}</span>
              </span>
            </div>

            {/* Editor Mode Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setEditorMode('side-by-side')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                    editorMode === 'side-by-side'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Side-by-Side Diff Comparison"
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Side-by-Side Diff</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('inline')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                    editorMode === 'inline'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Unified Inline Diff"
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Unified</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('patched')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                    editorMode === 'patched'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Interactive Patched Source Code"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Patched File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('original')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                    editorMode === 'original'
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Original Source Code"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Original</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(monacoModified, 'Patched code copied')}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors"
                  title="Copy Patched Code"
                >
                  {copiedStatus ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPatchedFile}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors"
                  title="Download Patched File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* IDE Split Body */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* 1. REAL IDE LEFT SIDEBAR: File Explorer with Security & Debt Badges */}
            {isSidebarOpen && (
              <div className="w-72 sm:w-80 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
                {/* Explorer Header */}
                <div className="p-3 border-b border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                      <FolderOpen className="w-4 h-4 text-indigo-400" />
                      <span>Explorer & Security Tree</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {filteredExplorerFiles.length} files
                    </span>
                  </div>

                  {/* Filter Tabs */}
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setExplorerFilter('issues-only')}
                      className={`px-2 py-1 rounded font-medium text-center transition-all ${
                        explorerFilter === 'issues-only'
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Issues ({enrichedFiles.filter((f) => f.totalIssues > 0).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExplorerFilter('security-only')}
                      className={`px-2 py-1 rounded font-medium text-center transition-all ${
                        explorerFilter === 'security-only'
                          ? 'bg-rose-600 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Security ({enrichedFiles.filter((f) => f.hasSecurity).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExplorerFilter('smells-only')}
                      className={`px-2 py-1 rounded font-medium text-center transition-all ${
                        explorerFilter === 'smells-only'
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Smells ({enrichedFiles.filter((f) => f.hasSmells).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExplorerFilter('all')}
                      className={`px-2 py-1 rounded font-medium text-center transition-all ${
                        explorerFilter === 'all'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Files ({enrichedFiles.length})
                    </button>
                  </div>

                  {/* Search in files */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search files or vulnerabilities..."
                      className="w-full bg-[#020617] border border-slate-800 rounded-lg px-2.5 py-1.5 pl-8 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* File Tree List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 p-1.5 space-y-1">
                  {filteredExplorerFiles.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p>No files match current filter.</p>
                    </div>
                  ) : (
                    paginatedExplorerFiles.map((fileItem) => {
                      const isActive = normalizePath(fileItem.path) === normalizePath(activeFilePath);
                      const isExpanded = expandedFileTrees[fileItem.path] ?? (isActive || fileItem.totalIssues > 0);

                      return (
                        <div key={fileItem.path} className="rounded-lg overflow-hidden transition-colors">
                          {/* File Row */}
                          <div
                            onClick={() => handleOpenFile(fileItem.path)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs group transition-all ${
                              isActive
                                ? 'bg-indigo-950/70 border border-indigo-700/60 text-white font-semibold shadow-inner'
                                : 'hover:bg-slate-900/80 text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {fileItem.totalIssues > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => toggleFileExpansion(fileItem.path, e)}
                                  className="text-slate-400 hover:text-slate-200 p-0.5 rounded"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-3.5" />
                              )}

                              {getLanguagePill(fileItem.language)}

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-slate-200 font-mono text-[11px]">
                                  {fileItem.name}
                                </p>
                                <p className="truncate text-[10px] text-slate-400">
                                  {fileItem.path}
                                </p>
                              </div>
                            </div>

                            {/* Issue Badges */}
                            <div className="flex items-center gap-1 shrink-0 ml-1.5">
                              {fileItem.criticalCount > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                                  {fileItem.criticalCount} Crit
                                </span>
                              )}
                              {fileItem.highCount > 0 && fileItem.criticalCount === 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  {fileItem.highCount} High
                                </span>
                              )}
                              {fileItem.totalSmells > 0 && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  {fileItem.totalSmells}
                                </span>
                              )}
                              {fileItem.totalIssues === 0 && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 opacity-60" />
                              )}
                            </div>
                          </div>

                          {/* Nested Issues Sub-Tree */}
                          {isExpanded && fileItem.totalIssues > 0 && (
                            <div className="pl-6 pr-2 py-1 space-y-1 bg-[#01040f]/60 border-l-2 border-indigo-900/60 ml-3 my-0.5 rounded-r">
                              {/* Security Findings under this file */}
                              {fileItem.securityFindings.map((sec) => (
                                <button
                                  key={sec.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenFile(fileItem.path, sec.id);
                                  }}
                                  className={`w-full text-left p-1.5 rounded flex items-center justify-between text-[11px] transition-colors ${
                                    isActive && selectedIssueId === sec.id
                                      ? 'bg-rose-950/80 text-rose-200 border border-rose-800/60 font-semibold'
                                      : 'hover:bg-slate-900/80 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span className="truncate">{sec.title}</span>
                                  </span>
                                  <span className="text-[9px] font-mono text-rose-400 shrink-0 ml-1">
                                    L{sec.lineStart}
                                  </span>
                                </button>
                              ))}

                              {/* Code Smells under this file */}
                              {fileItem.smells.map((smell) => (
                                <button
                                  key={smell.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenFile(fileItem.path, smell.id);
                                  }}
                                  className={`w-full text-left p-1.5 rounded flex items-center justify-between text-[11px] transition-colors ${
                                    isActive && selectedIssueId === smell.id
                                      ? 'bg-purple-950/80 text-purple-200 border border-purple-800/60 font-semibold'
                                      : 'hover:bg-slate-900/80 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                                    <span className="truncate">{smell.title}</span>
                                  </span>
                                  <span className="text-[9px] font-mono text-purple-400 shrink-0 ml-1">
                                    L{smell.lineStart}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Sidebar Pagination Footer */}
                {filteredExplorerFiles.length > 10 && (
                  <div className="p-2 border-t border-slate-800/80 bg-slate-950">
                    <PaginationControls
                      currentPage={explorerPage}
                      totalPages={explorerTotalPages}
                      totalItems={filteredExplorerFiles.length}
                      pageSize={explorerPageSize}
                      pageSizeOptions={[10, 20, 50, 'All']}
                      onPageChange={setExplorerPage}
                      onPageSizeChange={setExplorerPageSize}
                      itemLabel="files"
                      compact={true}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 2. REAL CODE EDITOR MAIN STAGE */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#020617] overflow-hidden">
              {/* Editor Open Tabs Bar */}
              <div className="h-9 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-2 shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center space-x-1">
                  {openTabs.map((tabPath) => {
                    const normPath = normalizePath(tabPath);
                    const fileObj = enrichedFiles.find((f) => normalizePath(f.path) === normPath);
                    const isActiveTab = normalizePath(activeFilePath) === normPath;
                    const fileName = tabPath.split('/').pop() || tabPath;

                    return (
                      <div
                        key={tabPath}
                        onClick={() => handleOpenFile(tabPath)}
                        className={`group h-7 px-2.5 rounded-t-md text-xs font-mono flex items-center gap-2 cursor-pointer border-t-2 transition-all ${
                          isActiveTab
                            ? 'bg-[#020617] border-indigo-500 text-white font-semibold'
                            : 'bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{fileName}</span>
                        {fileObj && fileObj.totalIssues > 0 && (
                          <span className={`text-[9px] font-bold px-1 rounded-full ${
                            fileObj.criticalCount > 0 ? 'bg-rose-500/30 text-rose-300' : 'bg-purple-500/30 text-purple-300'
                          }`}>
                            {fileObj.totalIssues}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleCloseTab(tabPath, e)}
                          className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Stepper controls */}
                {activeFileSuggestions.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleStepIssue('prev')}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[10px] flex items-center gap-0.5 cursor-pointer"
                      title="Previous Issue in File"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Prev</span>
                    </button>

                    <select
                      value={selectedIssueId}
                      onChange={(e) => setSelectedIssueId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
                    >
                      <option value="all">⚡ Full File Refactor ({activeFileSuggestions.length} Patches)</option>
                      {activeFileSuggestions.map((sug, idx) => (
                        <option key={sug.id} value={sug.id}>
                          {sug.type === 'security' ? '🔴' : '🟣'} #{idx + 1}: {sug.title} (L{sug.lineStart})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleStepIssue('next')}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[10px] flex items-center gap-0.5 cursor-pointer"
                      title="Next Issue in File"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Breadcrumb & Context Bar */}
              <div className="h-7 bg-[#020617] border-b border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-mono">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-400">src</span>
                  <span className="text-slate-400">›</span>
                  <span className="text-slate-300 font-semibold">{activeFileItem?.name || 'file'}</span>
                  {currentSuggestion && (
                    <>
                      <span className="text-slate-400">›</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        currentSuggestion.type === 'security'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {currentSuggestion.title} (Lines {currentSuggestion.lineStart}-{currentSuggestion.lineEnd})
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400">
                    {editorMode === 'side-by-side' ? 'Diff: Original ⟷ Clean Refactor' : 
                     editorMode === 'inline' ? 'Diff: Unified Changes' :
                     editorMode === 'patched' ? 'Full Patched Source' : 'Original Source'}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-indigo-400 font-bold uppercase">{activeFileItem?.language || 'typescript'}</span>
                </div>
              </div>

              {/* MONACO CODE EDITOR CANVAS */}
              <div className="flex-1 relative min-h-0 bg-[#020617] overflow-hidden">
                <NativeCodeEditor
                  mode={editorMode}
                  originalCode={monacoOriginal}
                  modifiedCode={monacoModified}
                  language={activeFileItem?.language || 'typescript'}
                  fontSize={fontSize}
                  wordWrap={wordWrap === 'on'}
                  showMinimap={showMinimap}
                  highlightLine={currentSuggestion?.lineStart}
                  readOnly={editorMode === 'original'}
                />
              </div>

              {/* 3. IDE BOTTOM DRAWER: Problems, Exploit Terminal, & Remediation */}
              <div className={`bg-slate-950 border-t border-slate-800 transition-all duration-200 flex flex-col shrink-0 ${
                isBottomDrawerOpen ? 'h-56' : 'h-8'
              }`}>
                {/* Drawer Header */}
                <div className="h-8 bg-slate-900/90 px-3 flex items-center justify-between border-b border-slate-800/80 text-xs shrink-0 select-none">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBottomDrawerOpen(true);
                        setActiveBottomTab('problems');
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isBottomDrawerOpen && activeBottomTab === 'problems'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Bug className="w-3.5 h-3.5 text-rose-400" />
                      <span>Problems ({problemScope === 'active-file' ? activeFileSuggestions.length : allWorkspaceSuggestions.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsBottomDrawerOpen(true);
                        setActiveBottomTab('remediation');
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isBottomDrawerOpen && activeBottomTab === 'remediation'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>Remediation & Exploit Guide</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsBottomDrawerOpen(true);
                        setActiveBottomTab('distillation');
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isBottomDrawerOpen && activeBottomTab === 'distillation'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>AST Distillation Specs</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBottomDrawerOpen(!isBottomDrawerOpen)}
                    className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 cursor-pointer"
                    title={isBottomDrawerOpen ? 'Collapse Panel' : 'Expand Panel'}
                  >
                    {isBottomDrawerOpen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Drawer Body */}
                {isBottomDrawerOpen && (
                  <div className="flex-1 overflow-y-auto p-3 text-xs bg-[#01040f]">
                    {activeBottomTab === 'problems' && (
                      <div className="space-y-3">
                        {/* Scope Toggle & Search */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-900">
                          <div className="flex items-center gap-1.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setProblemScope('active-file')}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                                problemScope === 'active-file'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Active File ({activeFileSuggestions.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setProblemScope('all-files')}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                                problemScope === 'all-files'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              All Workspace Files ({allWorkspaceSuggestions.length})
                            </button>
                          </div>

                          {/* All files filters when problemScope === 'all-files' */}
                          {problemScope === 'all-files' && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => setAllFilesFilterType('all')}
                                  className={`px-2 py-0.5 rounded ${allFilesFilterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                                >
                                  All ({allWorkspaceSuggestions.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAllFilesFilterType('security')}
                                  className={`px-2 py-0.5 rounded ${allFilesFilterType === 'security' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
                                >
                                  Security
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAllFilesFilterType('smells')}
                                  className={`px-2 py-0.5 rounded ${allFilesFilterType === 'smells' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                                >
                                  Smells
                                </button>
                              </div>

                              <input
                                type="text"
                                value={allFilesSearch}
                                onChange={(e) => setAllFilesSearch(e.target.value)}
                                placeholder="Filter problems..."
                                className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-200 placeholder-slate-500 w-32 sm:w-44 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}
                        </div>

                        {problemScope === 'active-file' ? (
                          activeFileSuggestions.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>No security vulnerabilities or code smells detected in {activeFileItem?.name || 'this file'}.</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                                {paginatedActiveFileSuggestions.map((sug) => (
                                  <div
                                    key={sug.id}
                                    onClick={() => setSelectedIssueId(sug.id)}
                                    className={`p-2.5 flex items-center justify-between hover:bg-slate-900/90 cursor-pointer transition-colors ${
                                      selectedIssueId === sug.id ? 'bg-indigo-950/60 font-semibold' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                        sug.type === 'security'
                                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                      }`}>
                                        {sug.badge}
                                      </span>
                                      <div>
                                        <span className="text-slate-200 font-medium">{sug.title}</span>
                                        <p className="text-[11px] text-slate-400 line-clamp-1">{sug.explanation}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                                      <span>Lines {sug.lineStart} - {sug.lineEnd}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedIssueId(sug.id);
                                        }}
                                        className="px-2 py-0.5 rounded bg-indigo-900/50 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 text-[10px] cursor-pointer"
                                      >
                                        Focus Diff
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {activeFileSuggestions.length > 5 && (
                                <PaginationControls
                                  currentPage={activeFileProblemsPage}
                                  totalPages={activeFileProblemsTotalPages}
                                  totalItems={activeFileSuggestions.length}
                                  pageSize={activeFileProblemsPageSize}
                                  pageSizeOptions={[5, 10, 20, 'All']}
                                  onPageChange={setActiveFileProblemsPage}
                                  onPageSizeChange={setActiveFileProblemsPageSize}
                                  itemLabel="file problems"
                                  compact={true}
                                />
                              )}
                            </div>
                          )
                        ) : (
                          /* Workspace-wide list */
                          filteredAllWorkspaceSuggestions.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Zero findings match current filter. Codebase passes all checks!</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                                {paginatedAllWorkspaceSuggestions.map(({ file, suggestion }) => (
                                  <div
                                    key={`${file.id}-${suggestion.id}`}
                                    onClick={() => handleOpenFile(file.path, suggestion.id)}
                                    className={`p-2.5 flex items-center justify-between hover:bg-slate-900/90 cursor-pointer transition-colors ${
                                      normalizePath(activeFilePath) === normalizePath(file.path) && selectedIssueId === suggestion.id
                                        ? 'bg-indigo-950/60 font-semibold'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                        suggestion.type === 'security'
                                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                      }`}>
                                        {suggestion.badge}
                                      </span>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                                            {file.name}
                                          </span>
                                          <span className="text-slate-200 font-medium">{suggestion.title}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{suggestion.explanation}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                                      <span>Lines {suggestion.lineStart} - {suggestion.lineEnd}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenFile(file.path, suggestion.id);
                                        }}
                                        className="px-2 py-0.5 rounded bg-indigo-900/50 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 text-[10px] cursor-pointer"
                                      >
                                        Open File Diff
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {filteredAllWorkspaceSuggestions.length > 10 && (
                                <PaginationControls
                                  currentPage={allFilesProblemsPage}
                                  totalPages={allFilesProblemsTotalPages}
                                  totalItems={filteredAllWorkspaceSuggestions.length}
                                  pageSize={allFilesProblemsPageSize}
                                  pageSizeOptions={[10, 25, 50, 100, 'All']}
                                  onPageChange={setAllFilesProblemsPage}
                                  onPageSizeChange={setAllFilesProblemsPageSize}
                                  itemLabel="workspace problems"
                                  compact={true}
                                />
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {activeBottomTab === 'remediation' && (
                      <div className="space-y-3">
                        {currentSuggestion ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{currentSuggestion.title}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                Lines {currentSuggestion.lineStart}-{currentSuggestion.lineEnd}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                              {currentSuggestion.explanation}
                            </p>
                            {currentSuggestion.benefits && (
                              <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-emerald-400">Hardening Checklist:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {currentSuggestion.benefits.map((b, bIdx) => (
                                    <div key={bIdx} className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900 p-1.5 rounded border border-slate-800">
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>{b}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs">
                            Select a specific security finding or code smell above to view targeted exploit mechanisms and remediation steps.
                          </div>
                        )}
                      </div>
                    )}

                    {activeBottomTab === 'distillation' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">AST Token Reduction</span>
                          <p className="text-base font-bold text-emerald-400">
                            {auditResult?.astMetrics.astReductionPercentage || 65}% Reduced
                          </p>
                          <p className="text-[10px] text-slate-400">Boilerplate stripped via smart parsing</p>
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Total Functions Extracted</span>
                          <p className="text-base font-bold text-indigo-400">
                            {auditResult?.astMetrics.totalFunctions || 14} Signatures
                          </p>
                          <p className="text-[10px] text-slate-400">Dependency call-sites mapped</p>
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Auditing Model Pipeline</span>
                          <p className="text-base font-bold text-cyan-400">
                            {auditResult?.modelUsed || 'Gemini 3.7 Flash'}
                          </p>
                          <p className="text-[10px] text-slate-400">Map-Reduce Hierarchical Pass</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. IDE STATUS BAR */}
              <div className="h-6 bg-slate-950 border-t border-slate-800 px-3 flex items-center justify-between text-[10px] text-slate-400 select-none shrink-0 font-mono">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Terminal className="w-3 h-3 text-indigo-400" />
                    <span>Ln {currentSuggestion?.lineStart || 1}, Col 1</span>
                  </span>
                  <span>Spaces: 2</span>
                  <span>UTF-8</span>
                  <span className="text-indigo-400 font-semibold">{activeFileItem?.language.toUpperCase() || 'TYPESCRIPT'}</span>
                </div>

                <div className="flex items-center gap-3">
                  {activeFileItem && (
                    <>
                      <span className="flex items-center gap-1 text-rose-400">
                        <AlertOctagon className="w-3 h-3" />
                        <span>{activeFileItem.totalSecurity} Vulns</span>
                      </span>
                      <span className="flex items-center gap-1 text-purple-400">
                        <Sparkles className="w-3 h-3" />
                        <span>{activeFileItem.totalSmells} Smells</span>
                      </span>
                    </>
                  )}
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Zero-Trust AST Ready</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storyline Navigation Footer */}
      {onNavigate && (
        <StorylineFooter
          currentTab="refactoring"
          onNavigate={onNavigate}
          prevTab="security"
          prevLabel="← Back to Security & OWASP (Step 3)"
          nextTab="export"
          nextLabel="Generate Certification Report (Step 5) →"
        />
      )}
    </div>
  );
};
