export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export type ComplexityLevel = 'Low' | 'Medium' | 'High' | 'Extreme';

export type SmellCategory = 
  | 'Anti-Pattern' 
  | 'Missing Error Handling' 
  | 'Tight Coupling' 
  | 'Performance Bottleneck' 
  | 'Dead Code' 
  | 'Complexity'
  | 'State Management';

export interface CodeFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  size: number;
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface AuditSummary {
  overallHealthScore: number; // 0-100
  cyclomaticComplexity: ComplexityLevel;
  maintainabilityScore: number; // 0-100
  securityScore: number; // 0-100
  totalVulnerabilities: number;
  totalCodeSmells: number;
  severityCounts: SeverityCounts;
  keyTakeaways: string[];
}

export interface ArchitectureComponent {
  name: string;
  type: string; // e.g. Controller, Service, DB, Queue, Gateway, Model
  description: string;
  dependencies?: string[];
}

export interface ArchitectureDataFlow {
  source: string;
  target: string;
  action: string;
  protocol?: string;
}

export interface ArchitectureDiagram {
  diagramType: 'graph TD' | 'sequenceDiagram' | 'flowchart' | 'C4' | 'classDiagram';
  mermaidDefinition: string;
  components: ArchitectureComponent[];
  dataFlows: ArchitectureDataFlow[];
  architectureRisks: string[];
}

export interface SecurityFinding {
  id: string;
  title: string;
  owaspCategory: string; // e.g., 'A01:2021-Broken Access Control', 'A03:2021-Injection'
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  filePath: string;
  lineStart: number;
  lineEnd: number;
  vulnerableCode: string;
  description: string;
  impact: string;
  remediationCode: string;
  remediationSteps: string[];
  cwe?: string;
}

export interface CodeSmell {
  id: string;
  title: string;
  category: SmellCategory;
  severity: 'High' | 'Medium' | 'Low';
  filePath: string;
  lineStart: number;
  lineEnd: number;
  snippet: string;
  explanation: string;
  refactoredCode: string;
  benefits: string[];
}

export interface ASTMetrics {
  totalLinesOfCode: number;
  totalFunctions: number;
  totalClassesOrModules: number;
  estimatedTokenCount: number;
  astReductionPercentage: number;
  languageBreakdown: Record<string, number>;
}

export interface AuditResult {
  id: string;
  timestamp: string;
  repoName: string;
  summary: AuditSummary;
  architecture: ArchitectureDiagram;
  securityAudit: SecurityFinding[];
  codeSmells: CodeSmell[];
  astMetrics: ASTMetrics;
  scannedFilesCount: number;
  executionTimeMs: number;
  modelUsed: string;
}

export interface AuditHistoryItem {
  id: string;
  timestamp: string;
  repoName: string;
  overallScore: number;
  criticalCount: number;
  vulnerabilitiesCount: number;
  codeSmellsCount: number;
  filesCount: number;
  modelUsed: string;
  files: CodeFile[];
  auditResult: AuditResult;
}

export type ActiveTab = 
  | 'upload' 
  | 'execution'
  | 'overview' 
  | 'architecture' 
  | 'security' 
  | 'refactoring' 
  | 'export'
  | 'c4-spec';

export interface CodePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  language: string;
  files: Array<{ name: string; path: string; language: string; content: string }>;
}
