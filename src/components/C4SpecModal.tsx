import React, { useState, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Database, 
  GitBranch, 
  Cpu, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Lock, 
  Globe, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Search, 
  Download, 
  Calculator, 
  Server, 
  RefreshCw,
  Terminal,
  FileCheck
} from 'lucide-react';

interface C4SpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SpecCategory = 'all' | 'core' | 'addendum' | 'cost_simulator' | 'schemas' | 'compliance_dr';

export const C4SpecModal: React.FC<C4SpecModalProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<SpecCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Interactive Cost Estimator State (Section 9 simulator)
  const [locInput, setLocInput] = useState<number>(350000);
  const [moduleCount, setModuleCount] = useState<number>(24);
  const [selectedTier, setSelectedTier] = useState<'standard' | 'deep_reasoning'>('standard');
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);

  // Calculated Cost Values
  const costEstimate = useMemo(() => {
    // Estimating ~25 tokens per LOC on average after AST distillation
    const estimatedAstTokens = Math.round(locInput * 0.15 * 10); // 85% reduced AST skeleton
    const mapTokensPerModule = Math.round(estimatedAstTokens / Math.max(1, moduleCount));
    
    // Pricing lookup (sample rates in cents / 1k tokens)
    const flashMapRate = isFallbackActive ? 0.0003 : 0.00015; // Gemini Flash vs Fallback
    const proReduceRate = isFallbackActive ? 0.0030 : 0.00125; // Gemini Pro vs Claude Sonnet fallback
    const embeddingRate = 0.00002;
    const storageRatePerGbMonth = 0.023; // S3 standard

    const mapCost = (moduleCount * mapTokensPerModule * flashMapRate) / 1000;
    const reduceTokens = Math.round(moduleCount * 450); // Summaries aggregated
    const reduceCost = (reduceTokens * proReduceRate) / 1000;
    const embeddingCost = (estimatedAstTokens * embeddingRate) / 1000;
    const compressedSizeGb = Math.max(0.001, (locInput * 60) / (1024 * 1024 * 1024)); // approx byte size
    const storageCost = (compressedSizeGb * storageRatePerGbMonth) / 30;

    const totalCostDollars = mapCost + reduceCost + embeddingCost + storageCost;
    const totalTokens = (moduleCount * mapTokensPerModule) + reduceTokens + estimatedAstTokens;
    const historicalAvgTenantCost = 0.45; // baseline historical avg
    const circuitBreakerTriggered = totalCostDollars > (historicalAvgTenantCost * 3);

    return {
      astTokens: estimatedAstTokens,
      mapCostDollars: mapCost,
      reduceCostDollars: reduceCost,
      embeddingCostDollars: embeddingCost,
      storageCostDollars: storageCost,
      totalCostDollars,
      totalTokens,
      circuitBreakerTriggered,
      circuitBreakerRatio: (totalCostDollars / historicalAvgTenantCost).toFixed(1)
    };
  }, [locInput, moduleCount, selectedTier, isFallbackActive]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fullSpecMarkdown = `# CodePulse AI: Enterprise Architecture & System Engineering Specification
## Including Addendum Sections 9–14: Closing the Enterprise Readiness Gaps
Document Status: APPROVED FOR IMPLEMENTATION • Level 4 Mission-Critical Infrastructure

### 1. Executive Summary & Vision Statement
CodePulse AI treats entire codebases as unified semantic graphs powered by Google AI Studio Gemini models, executing multi-pass audits in under 30 seconds.

### 2. Core Architectural Foundations
- Zero-Trust Ingestion: Client-side stripping of credentials, RSA keys, and .env files before memory egress.
- AST Distillation & Map-Reduce: Reduces multi-million LOC codebases by up to 85% payload volume.

### 3. C4 Level 1 & Level 2 Container Architecture
Ingress Gateway (Kong/Envoy) -> WASM AST Extractor -> Temporal.io Orchestrator -> Multi-Model AI Router -> Mermaid.js Vector Renderer & PostgreSQL.

### 4. Core PostgreSQL Schema (DDL)
Standard audit_runs and audit_findings tables.

### 5. Multi-Model AI Routing & Latency Budgets
- Deep Audit: <30 seconds SLA
- Incremental AST Diff: <3 seconds SLA

### 6. Distributed State & Multi-Tenant Isolation
Tenant scoping via Supabase Row-Level Security (RLS) policies.

### 7. Security & Compliance
Zero Prompt Data Retention, Client-Side Secret Redaction, SOC2 Type I readiness target at Month 6.

### 8. Roadmap (Renumbered to Section 15)

---
## ADDENDUM SECTIONS 9–14: CLOSING THE ENTERPRISE READINESS GAPS

### 9. Unit Economics & Cost Model
Total Cost = (Map Phase Cost) + (Reduce Phase Cost) + (Embedding Cost) + (Storage Cost)
- Map Phase: Σ (module_token_count × flash_rate_per_token)
- Reduce Phase: aggregated_summary_tokens × pro_rate_per_token
- Embedding: distilled_ast_tokens × embedding_rate_per_token
- Storage: (compressed_repo_size_gb × s3_rate_per_gb_month) / 30
Circuit Breaker: Automatic pause if projected cost > 3x historical average.

### 10. Billing, Metering & Subscription Schema
PostgreSQL tables: subscription_plans, organization_subscriptions, usage_records, invoices.
Quota enforcement checked at API Gateway prior to dispatch.

### 11. Audit Logging & Row-Level Security
- Table: audit_logs (append-only, 1-year hot / 7-year cold retention)
- RLS Policy: (organization_id = (auth.jwt() ->> 'organization_id')::uuid) on all multi-tenant tables.
- CI pipeline policy check enforcement.

### 12. Data Residency & Regulatory Compliance
- Regional pinning: US, EU, APAC with Vertex AI local inference and localized Supabase storage.
- GDPR Ch. V Standard Contractual Clauses (SCCs) and Transfer Impact Assessments (TIA).
- Subprocessor disclosure list with 30-day notice.
- Right to erasure: 30-day deletion SLA across all caches & embeddings.

### 13. Disaster Recovery & Business Continuity
- Starter/Team: RPO 24h, RTO 8h
- Enterprise: RPO 15min, RTO 1h (Continuous WAL streaming + PITR, cross-region S3 replication)
- Quarterly chaos testing across PostgreSQL, Kafka/EventBridge, and AI provider fallback.

### 14. Internal CI/CD & Quality Assurance (Testing CodePulse Itself)
- Test pyramid with regression corpus of known secret patterns.
- Dogfooding: CodePulse scans its own codebase on every PR; findings > HIGH block merge.
- Secret scanning pre-commit hooks and canary model deployment.

### Appendix: SOC2 Type I vs Type II Roadmap Calibration
Target Phase 4 deliverable as SOC2 Type I readiness at Month 6, with SOC2 Type II certification scheduled for Month 12–18 following the formal observation period.`;

  const handleDownloadSpec = () => {
    const blob = new Blob([fullSpecMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'CodePulse_Enterprise_Architecture_Spec_Sections_1_14.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sqlBillingSchema = `-- Subscription Plan Definitions
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(100) NOT NULL,              -- 'starter', 'team', 'enterprise'
    monthly_audit_quota INT NOT NULL,              -- number of audit runs included
    max_repo_size_loc INT,                         -- lines-of-code ceiling for this plan
    included_seats INT NOT NULL DEFAULT 1,
    overage_rate_per_audit_cents INT,              -- billed cost per audit beyond quota
    base_price_cents INT NOT NULL,
    billing_interval VARCHAR(20) DEFAULT 'monthly', -- monthly, annual
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Active Subscriptions per Organization
CREATE TABLE organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active',           -- active, past_due, canceled, trialing
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_provider_ref VARCHAR(255),             -- Stripe/Paddle subscription ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Per-Run Usage & Cost Metering (feeds Section 9's cost model)
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    audit_run_id UUID REFERENCES audit_runs(id) ON DELETE CASCADE,
    model_used VARCHAR(100) NOT NULL,              -- e.g. 'gemini-1.5-flash', 'claude-3-5-sonnet' (fallback)
    input_tokens BIGINT NOT NULL,
    output_tokens BIGINT NOT NULL,
    computed_cost_cents INT NOT NULL,
    was_fallback BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoicing
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    base_amount_cents INT NOT NULL,
    overage_amount_cents INT NOT NULL DEFAULT 0,
    total_amount_cents INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',          -- pending, paid, failed, void
    payment_provider_invoice_ref VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  const sqlAuditRlsSchema = `-- Section 11: Audit Logging Table (Append-Only)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id),
    actor_ip INET,
    event_type VARCHAR(100) NOT NULL,       -- 'login', 'audit_run_triggered', 'repo_added',
                                             -- 'finding_viewed', 'user_role_changed', 'sso_config_updated'
    resource_type VARCHAR(100),             -- 'repository', 'audit_run', 'user', 'organization'
    resource_id UUID,
    metadata JSONB,                         -- event-specific detail (before/after diff for config changes)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs must be append-only: no UPDATE or DELETE grants for any application role.
-- Retention: minimum 1 year hot storage (queryable), 7 years cold storage (S3 Glacier)
CREATE INDEX idx_audit_logs_org_time ON audit_logs (organization_id, created_at DESC);

-- Supabase/PostgreSQL Row-Level Security (RLS) Policy Pattern
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_repositories ON repositories
    FOR ALL
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

ALTER TABLE audit_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_audit_runs ON audit_runs
    FOR ALL
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_usage_records ON usage_records
    FOR ALL
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
    FOR ALL
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#090D16]/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#090D16] border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight font-display">
                  CodePulse AI: Enterprise Architecture & Engineering Specification
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold uppercase tracking-wider">
                  Sections 1–14 Complete
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Document Status: APPROVED FOR IMPLEMENTATION • Addendum Integrated • Level 4 Mission-Critical
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSpec}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Download Full Markdown Specification"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Spec (.md)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Search Toolbar */}
        <div className="px-6 py-3 bg-[#0B0F19] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Full Spec (1–14)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('addendum')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'addendum'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-indigo-950/40 text-indigo-300 hover:text-white hover:bg-indigo-900/50 border border-indigo-800/40'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Addendum (Sec 9–14)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('cost_simulator')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'cost_simulator'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-emerald-950/30 text-emerald-300 hover:text-white hover:bg-emerald-900/40 border border-emerald-800/40'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cost Model Simulator (Sec 9)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('schemas')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'schemas'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Billing & RLS DDL (Sec 10–11)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('compliance_dr')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'compliance_dr'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Residency & DR (Sec 12–14)</span>
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spec & schemas..."
              className="w-full bg-[#090D16] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-8 text-xs text-slate-300 leading-relaxed font-sans">
          
          {/* ========================================================
              SECTION 9 INTERACTIVE SIMULATOR (Cost Model & Unit Economics)
             ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'cost_simulator' || activeCategory === 'addendum') && (
            <div className="p-5 bg-gradient-to-b from-indigo-950/30 to-[#090D16] border border-indigo-500/40 rounded-xl space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-900/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold font-mono">
                    9
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Section 9: Unit Economics & Cost Engine Simulation</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-semibold">
                        Addendum Core
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Evaluates Token Map-Reduce formula, live dynamic rate cards, and tenant margin circuit-breaker threshold.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">Circuit Breaker:</span>
                  {costEstimate.circuitBreakerTriggered ? (
                    <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-600/40 text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      TRIPPED ({costEstimate.circuitBreakerRatio}x Avg)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      NORMAL ({costEstimate.circuitBreakerRatio}x Avg)
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Simulator Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex justify-between">
                    <span>Repository LOC Size</span>
                    <span className="font-mono text-indigo-300 font-bold">{locInput.toLocaleString()} LOC</span>
                  </label>
                  <input
                    type="range"
                    min="10000"
                    max="3000000"
                    step="25000"
                    value={locInput}
                    onChange={(e) => setLocInput(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10k</span>
                    <span>1M (Enterprise)</span>
                    <span>3M+ Monorepo</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex justify-between">
                    <span>AST Distilled Modules</span>
                    <span className="font-mono text-indigo-300 font-bold">{moduleCount} Modules</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="120"
                    step="2"
                    value={moduleCount}
                    onChange={(e) => setModuleCount(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>2 (Micro)</span>
                    <span>40 (Core)</span>
                    <span>120 (Monolith)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Routing Engine Path
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFallbackActive(false)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        !isFallbackActive
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-[#090D16] text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Gemini 3.7 Flash/Pro
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFallbackActive(true)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isFallbackActive
                          ? 'bg-amber-600 text-white border-amber-400'
                          : 'bg-[#090D16] text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Fallback Cascade
                    </button>
                  </div>
                </div>
              </div>

              {/* Calculated Results Bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-[#090D16] border border-slate-800 rounded-lg">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Map Phase (Flash)
                  </span>
                  <span className="text-base font-bold text-slate-200 font-mono mt-0.5 block">
                    ${costEstimate.mapCostDollars.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {moduleCount} parallel partitions
                  </span>
                </div>

                <div className="p-3 bg-[#090D16] border border-slate-800 rounded-lg">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Reduce Phase (Pro)
                  </span>
                  <span className="text-base font-bold text-slate-200 font-mono mt-0.5 block">
                    ${costEstimate.reduceCostDollars.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Synthesized AST graph
                  </span>
                </div>

                <div className="p-3 bg-[#090D16] border border-slate-800 rounded-lg">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Embedding & Storage
                  </span>
                  <span className="text-base font-bold text-slate-200 font-mono mt-0.5 block">
                    ${(costEstimate.embeddingCostDollars + costEstimate.storageCostDollars).toFixed(4)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {costEstimate.astTokens.toLocaleString()} distilled tokens
                  </span>
                </div>

                <div className="p-3 bg-indigo-950/40 border border-indigo-700/60 rounded-lg">
                  <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider block">
                    Total Audit Cost
                  </span>
                  <span className="text-base font-bold text-indigo-200 font-mono mt-0.5 block">
                    ${costEstimate.totalCostDollars.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono block">
                    {costEstimate.totalTokens.toLocaleString()} total tokens
                  </span>
                </div>
              </div>

              {/* 9.2 Required Instrumentation Table */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span>9.2 Required Instrumentation & Margin Guardrails</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border border-slate-800 rounded-lg overflow-hidden font-sans">
                    <thead className="bg-[#090D16] text-slate-300 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Metric</th>
                        <th className="p-2.5">Purpose</th>
                        <th className="p-2.5">Owner Component</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-400">
                      <tr className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-mono text-indigo-300">Tokens in/out per run, per model</td>
                        <td className="p-2.5">Feeds Map/Reduce/Embedding cost formula</td>
                        <td className="p-2.5">AI Router & Broker</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-mono text-indigo-300">Actual cost per audit run</td>
                        <td className="p-2.5">Margin tracking per tenant organization</td>
                        <td className="p-2.5">Token Quota & Cost Tracking Engine</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-mono text-indigo-300">Cost per LOC bracket (&lt;100k, 1M, 3M+)</td>
                        <td className="p-2.5">Pricing tier and overage validation</td>
                        <td className="p-2.5">Finance & Product Engineering</td>
                      </tr>
                      <tr className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-mono text-indigo-300">Fallback-cascade trigger rate & delta</td>
                        <td className="p-2.5">Budgets fallback cost variances when primary path fails</td>
                        <td className="p-2.5">AI Router & Broker</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 10: BILLING, METERING & SUBSCRIPTION SCHEMA
             ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'schemas' || activeCategory === 'addendum') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold font-mono">
                    10
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Section 10: Billing, Metering & Subscription Schema (DDL)</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/50 font-semibold">
                        PostgreSQL / Supabase
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Enforces pre-dispatch quota checks at API Gateway and records immutable per-run token costs.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(sqlBillingSchema, 'billing_sql')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'billing_sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedKey === 'billing_sql' ? 'Copied DDL' : 'Copy Schema'}</span>
                </button>
              </div>

              <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto max-h-64 scrollbar-thin">
                <pre>{sqlBillingSchema}</pre>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 11: AUDIT LOGGING & ROW-LEVEL SECURITY (RLS)
             ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'schemas' || activeCategory === 'addendum') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-bold font-mono">
                    11
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Section 11: Audit Logging & Zero-Trust Row-Level Security (RLS)</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50 font-semibold">
                        SOC2 Type II Mandate
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Append-only audit log tables with minimum 1-year hot / 7-year cold retention and JWT-scoped tenant isolation.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(sqlAuditRlsSchema, 'rls_sql')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'rls_sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedKey === 'rls_sql' ? 'Copied Policies' : 'Copy Policies'}</span>
                </button>
              </div>

              <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto max-h-64 scrollbar-thin">
                <pre>{sqlAuditRlsSchema}</pre>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 12: DATA RESIDENCY & REGULATORY COMPLIANCE
             ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'compliance_dr' || activeCategory === 'addendum') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold font-mono">
                  12
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Section 12: Data Residency, GDPR & Regulatory Compliance</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Regional boundary isolation, Subprocessor disclosure, Right to Erasure SLAs, and Data Processing Agreements.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Globe className="w-4 h-4" />
                    <span>Data Residency Pinning (US / EU / APAC)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tenants select processing region at onboarding. All inference routes to regional Vertex AI endpoints and storage binds to localized Supabase/S3 buckets.
                  </p>
                </div>

                <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cross-Border Transfer & GDPR Ch. V</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Standard Contractual Clauses (SCCs) executed with Google Cloud, Anthropic, and Microsoft with active Transfer Impact Assessments (TIA) on file.
                  </p>
                </div>

                <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Subprocessor Disclosure & 30-Day Notice</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Maintains public subprocessor registry (GCP, Anthropic, Azure, Supabase) with automated 30-day customer notification for changes.
                  </p>
                </div>

                <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <Lock className="w-4 h-4" />
                    <span>Right to Erasure & Zero Fine-Tuning</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    30-day cryptographic purge SLA for repositories, AST caches, and embeddings. Contractual guarantee that zero customer code is used for LLM fine-tuning.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 13: DISASTER RECOVERY & BUSINESS CONTINUITY
             ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'compliance_dr' || activeCategory === 'addendum') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold font-mono">
                  13
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Section 13: Disaster Recovery, Backup Cadence & Chaos Testing</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recovery objectives, point-in-time PostgreSQL WAL streaming, and quarterly failure scenario drills.
                  </p>
                </div>
              </div>

              {/* RPO / RTO Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border border-slate-800 rounded-lg overflow-hidden font-sans">
                  <thead className="bg-[#090D16] text-slate-300 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Subscription Tier</th>
                      <th className="p-2.5">RPO (Max Data Loss)</th>
                      <th className="p-2.5">RTO (Max Downtime)</th>
                      <th className="p-2.5">Mechanism</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-400">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-slate-300">Starter / Team</td>
                      <td className="p-2.5 font-mono text-amber-400">24 Hours</td>
                      <td className="p-2.5 font-mono text-amber-400">8 Hours</td>
                      <td className="p-2.5">Daily automated backups, single-region deployment</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-bold text-emerald-300">Enterprise</td>
                      <td className="p-2.5 font-mono text-emerald-400 font-bold">15 Minutes</td>
                      <td className="p-2.5 font-mono text-emerald-400 font-bold">1 Hour</td>
                      <td className="p-2.5 text-slate-300">Continuous WAL streaming + PITR, cross-region S3 replication, Temporal.io durable execution</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4 Failure Scenarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
                  <span className="font-bold text-indigo-300 font-mono block">Scenario 1: Primary Postgres Outage</span>
                  <p className="text-slate-400 text-[11px]">Automatic failover to read replica, promotion, and write path verification in &lt;15 minutes.</p>
                </div>
                <div className="p-3 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
                  <span className="font-bold text-indigo-300 font-mono block">Scenario 2: Mid-Audit Broker Failure</span>
                  <p className="text-slate-400 text-[11px]">Kafka/EventBridge broker outage flags run as FAILED without partial dirty finding writes.</p>
                </div>
                <div className="p-3 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
                  <span className="font-bold text-indigo-300 font-mono block">Scenario 3: Provider-Wide AI Outage</span>
                  <p className="text-slate-400 text-[11px]">Queues incoming audits with transparent tenant status updates instead of silent drops.</p>
                </div>
                <div className="p-3 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
                  <span className="font-bold text-indigo-300 font-mono block">Scenario 4: Chaos Testing Cadence</span>
                  <p className="text-slate-400 text-[11px]">Quarterly automated chaos experiments executed in staging mimicking production topology.</p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 14: INTERNAL CI/CD & DOGFOODING QUALITY ASSURANCE
             ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'compliance_dr' || activeCategory === 'addendum') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 font-bold font-mono">
                  14
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Section 14: Internal CI/CD & Quality Assurance (Testing CodePulse Itself)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dogfooding, secret scanner regression fixtures, canary model deployments, and latency error budgets.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <Terminal className="w-4 h-4" />
                    <span>Dogfooding on Merge</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    CodePulse’s repository is audited by CodePulse on every pull request. Findings above HIGH severity block merge.
                  </p>
                </div>

                <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Lock className="w-4 h-4" />
                    <span>Pre-Commit Secret Shield</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pre-commit hook + CI-stage scan enforcing the Secret Sanitizer component against CodePulse’s own source code.
                  </p>
                </div>

                <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Activity className="w-4 h-4" />
                    <span>Canary Deployments & SLA</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Prompt updates canary-route to &lt;5% of tenants to prevent silent finding regressions. Latency budget tracked (&lt;30s deep, &lt;3s fast).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              APPENDIX: SOC2 ROADMAP RECALIBRATION
             ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'compliance_dr' || activeCategory === 'addendum') && (
            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Appendix: Section 7 SOC2 Claim Recalibration</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                SOC2 <strong>Type II</strong> certification requires an observation period (typically 3–12 months) during which controls operate in live production. Phase 4 deliverable is formally calibrated to <strong>SOC2 Type I readiness</strong> (control design assessment) at Month 6, with full Type II certification targeted for Month 12–18 following observation window elapsing.
              </p>
            </div>
          )}

          {/* ========================================================
              SECTIONS 1–4: CORE ARCHITECTURE (Original Spec)
             ======================================================== */}
          {(activeCategory === 'all' || activeCategory === 'core') && (
            <div className="space-y-6 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold font-mono">
                  1-8
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Core Architectural Foundations & C4 Diagrams (Sections 1–8)
                  </h3>
                  <p className="text-xs text-slate-400">
                    System topology, WASM AST parser pipeline, and multi-model dispatching layers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
                  <span className="text-xs font-bold text-slate-200 block">Zero-Trust Ingestion</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Credentials, RSA private keys, and .env files are stripped client-side via WebAssembly parsers before leaving local memory.
                  </p>
                </div>
                <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg space-y-1">
                  <span className="text-xs font-bold text-slate-200 block">AST Distillation & Map-Reduce</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Extracts structural skeletons, function signatures, and route decorators to reduce payload by up to 85% for multi-million line codebases.
                  </p>
                </div>
              </div>

              {/* C4 Diagram Preview */}
              <div className="p-4 bg-[#090D16] border border-slate-800 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto">
                <pre>{`[Developers / VCS (GitHub/GitLab)]
               │
               ▼  (HTTPS / TLS 1.3)
[Ingress & Security Gateway (Kong/Envoy Mesh)]
               │
   ┌───────────┴──────────────────────────────┐
   ▼                                          ▼
[WASM AST Extractor & Secret Stripper]   [Temporal.io Orchestrator]
   │                                          │
   └───────────┬──────────────────────────────┘
               ▼
[Multi-Model AI Router (Gemini 3.7 Flash / Pro)]
               │
               ▼
[Mermaid.js Vector Renderer & PostgreSQL Database]`}</pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 bg-[#090D16] border-t border-slate-800/80 gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Enterprise Compliance: SOC2 Type I / ISO 27001 Ready • Multi-Tenant RLS</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadSpec}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
            >
              Export Markdown
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border border-indigo-400/30 shadow-lg shadow-indigo-600/25"
            >
              Close Specification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
