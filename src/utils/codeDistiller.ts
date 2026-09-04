// Strategic Code Distillation & Dependency Graph Mapping Engine
// Performs AST-based structural extraction, strips boilerplate, and builds dependency trees.

export interface DistilledFile {
  id: string;
  name: string;
  path: string;
  language: string;
  originalSize: number;
  distilledSize: number;
  distilledContent: string;
  imports: string[];
  exports: string[];
  components: string[];
  routes: string[];
  schemas: string[];
  functionSignatures: string[];
}

export interface DependencyNode {
  path: string;
  name: string;
  domain: string;
  imports: string[];
  importedBy: string[];
  layer: 'Ingress / API' | 'Domain Service' | 'Persistence / DB' | 'Model / Schema' | 'Utility / Config' | 'UI / Client';
}

export interface DependencyGraph {
  nodes: Record<string, DependencyNode>;
  domainClusters: Record<string, string[]>;
  totalFiles: number;
  totalImports: number;
}

// 1. Ast-Based Structural Extraction: Extracts component definitions, API routes, database schemas, function signatures, and imports/exports
export function distillSourceCode(code: string, filePath: string, language: string): DistilledFile {
  const lines = code.split('\n');
  const imports: string[] = [];
  const exports: string[] = [];
  const components: string[] = [];
  const routes: string[] = [];
  const schemas: string[] = [];
  const functionSignatures: string[] = [];

  const distilledLines: string[] = [];
  let insideBlockComment = false;
  let inFunctionBody = false;
  let braceDepth = 0;
  let currentSignature = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip multi-line comments
    if (trimmed.startsWith('/*')) insideBlockComment = true;
    if (insideBlockComment) {
      if (trimmed.endsWith('*/') || trimmed.includes('*/')) insideBlockComment = false;
      continue;
    }
    // Skip single-line comments and blank lines
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || !trimmed) {
      continue;
    }

    // Capture Imports
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('from ') ||
      /require\s*\(['"][^'"]+['"]\)/.test(trimmed) ||
      trimmed.startsWith('include ') ||
      trimmed.startsWith('use ')
    ) {
      imports.push(trimmed);
      distilledLines.push(trimmed);

      // Extract import target
      const match = trimmed.match(/from\s+['"]([^'"]+)['"]/) || trimmed.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
      if (match && match[1]) {
        // Track target
      }
      continue;
    }

    // Capture Exports
    if (trimmed.startsWith('export ') || trimmed.startsWith('module.exports') || trimmed.startsWith('exports.')) {
      exports.push(trimmed);
    }

    // Capture API Routes & Ingress Handlers
    if (
      /(?:app|router|server|api)\.(get|post|put|patch|delete|all|use)\s*\(\s*['"][^'"]+['"]/i.test(trimmed) ||
      /@(Get|Post|Put|Delete|Patch|RequestMapping)\s*\(/i.test(trimmed) ||
      /@app\.(get|post|put|delete)/i.test(trimmed)
    ) {
      routes.push(trimmed);
      distilledLines.push(trimmed);
      continue;
    }

    // Capture Database Schemas, Models, ORM Entities, Tables
    if (
      /(?:pgTable|createTable|sqliteTable|mysqlTable|Schema|new\s+Schema|Entity|@Entity|model\s+\w+|struct\s+\w+Impl)/i.test(trimmed) ||
      /(?:CREATE\s+TABLE|ALTER\s+TABLE)/i.test(trimmed)
    ) {
      schemas.push(trimmed);
      distilledLines.push(trimmed);
      continue;
    }

    // Capture React / UI Components
    if (
      /(?:export\s+(?:default\s+)?(?:function|const)\s+([A-Z]\w+)|class\s+([A-Z]\w+)\s+extends\s+React)/.test(trimmed)
    ) {
      const match = trimmed.match(/(?:function|const|class)\s+([A-Z]\w+)/);
      if (match && match[1]) {
        components.push(match[1]);
      }
      distilledLines.push(trimmed);
      continue;
    }

    // Capture Class / Interface / Type Declarations
    if (
      /(?:class\s+\w+|interface\s+\w+|type\s+\w+\s*=|struct\s+\w+|enum\s+\w+|trait\s+\w+)/.test(trimmed)
    ) {
      distilledLines.push(trimmed);
      continue;
    }

    // Capture Function Signatures
    if (
      /(?:async\s+)?(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|def\s+\w+|async\s+def\s+\w+|func\s+\w+|public\s+(?:async\s+)?[\w<>]+\s+\w+\()/i.test(trimmed)
    ) {
      functionSignatures.push(trimmed);
      distilledLines.push(trimmed);

      // If line contains critical security/data operations, keep it
      continue;
    }

    // Keep security-sensitive lines (cryptography, sql queries, env access, exec calls)
    if (
      /(?:jwt|secret|query|execute|password|token|process\.env|crypto|bcrypt|eval|exec|fetch|axios|auth)/i.test(trimmed)
    ) {
      distilledLines.push(`  // [Critical AST Node]: ${trimmed}`);
      continue;
    }

    // If file is short (< 60 lines), keep everything for fidelity
    if (lines.length < 60) {
      distilledLines.push(rawLine);
    }
  }

  const distilledContent = distilledLines.join('\n');
  const originalSize = code.length;
  const distilledSize = distilledContent.length;

  return {
    id: `distilled-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`,
    name: filePath.split('/').pop() || filePath,
    path: filePath,
    language,
    originalSize,
    distilledSize,
    distilledContent: distilledContent || code.slice(0, 3000),
    imports,
    exports,
    components,
    routes,
    schemas,
    functionSignatures
  };
}

// 2. Classify domain / layer for a given file path
export function classifyDomain(filePath: string): string {
  const normalized = filePath.toLowerCase();
  if (normalized.includes('/auth') || normalized.includes('auth.') || normalized.includes('jwt') || normalized.includes('session')) return 'Authentication & Identity';
  if (normalized.includes('/api') || normalized.includes('/route') || normalized.includes('/controller') || normalized.includes('server.') || normalized.includes('app.')) return 'API & Ingress Routing';
  if (normalized.includes('/service') || normalized.includes('/domain') || normalized.includes('/core') || normalized.includes('/usecase')) return 'Domain Business Logic';
  if (normalized.includes('/db') || normalized.includes('/database') || normalized.includes('/model') || normalized.includes('/schema') || normalized.includes('/repo')) return 'Persistence & Database';
  if (normalized.includes('/payment') || normalized.includes('/billing') || normalized.includes('/stripe')) return 'Billing & Payments';
  if (normalized.includes('/ui') || normalized.includes('/component') || normalized.includes('/view') || normalized.includes('/page') || normalized.includes('/client')) return 'Client & UI Layer';
  if (normalized.includes('/util') || normalized.includes('/helper') || normalized.includes('/lib') || normalized.includes('/config')) return 'Utilities & Config';
  return 'Core Application Module';
}

// 3. Build Global Dependency & Import Graph
export function buildDependencyGraph(files: Array<{ path: string; content: string; language?: string }>): DependencyGraph {
  const nodes: Record<string, DependencyNode> = {};
  const domainClusters: Record<string, string[]> = {};
  let totalImports = 0;

  // Initialize nodes
  files.forEach((f) => {
    const domain = classifyDomain(f.path);
    if (!domainClusters[domain]) domainClusters[domain] = [];
    domainClusters[domain].push(f.path);

    let layer: DependencyNode['layer'] = 'Domain Service';
    const p = f.path.toLowerCase();
    if (p.includes('api') || p.includes('route') || p.includes('controller') || p.includes('server')) layer = 'Ingress / API';
    else if (p.includes('db') || p.includes('repo') || p.includes('database')) layer = 'Persistence / DB';
    else if (p.includes('model') || p.includes('schema')) layer = 'Model / Schema';
    else if (p.includes('component') || p.includes('view') || p.includes('ui')) layer = 'UI / Client';
    else if (p.includes('util') || p.includes('config') || p.includes('lib')) layer = 'Utility / Config';

    nodes[f.path] = {
      path: f.path,
      name: f.path.split('/').pop() || f.path,
      domain,
      imports: [],
      importedBy: [],
      layer
    };
  });

  // Extract relationships
  files.forEach((f) => {
    const lines = f.content.split('\n');
    lines.forEach((line) => {
      const match = line.match(/(?:from|require\()\s*['"]([^'"]+)['"]/);
      if (match && match[1]) {
        const importSpecifier = match[1];
        totalImports++;
        nodes[f.path]?.imports.push(importSpecifier);

        // Check if relative path points to another file in our dataset
        if (importSpecifier.startsWith('.')) {
          const baseDir = f.path.substring(0, f.path.lastIndexOf('/'));
          const resolvedApprox = importSpecifier.replace(/^\.\//, '').replace(/^\.\.\//, '');

          // Find match in files
          const target = Object.keys(nodes).find((p) => p.includes(resolvedApprox));
          if (target && target !== f.path) {
            if (!nodes[target].importedBy.includes(f.path)) {
              nodes[target].importedBy.push(f.path);
            }
          }
        }
      }
    });
  });

  return {
    nodes,
    domainClusters,
    totalFiles: files.length,
    totalImports
  };
}

// 4. Group files into modular domains for Map-Reduce chunking
export function groupFilesIntoDomains(files: Array<{ path: string; name: string; content: string; language?: string }>) {
  const groups: Record<string, typeof files> = {};

  files.forEach((file) => {
    const domain = classifyDomain(file.path);
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(file);
  });

  return groups;
}
