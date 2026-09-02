import { CodePreset, AuditResult } from '../types';

export const CODE_PRESETS: CodePreset[] = [
  {
    id: 'ecommerce-payment-svc',
    name: 'E-Commerce Order & Payment Microservice',
    description: 'Node.js/Express service with Stripe integration, database queries, and JWT authentication.',
    category: 'Backend & Fintech',
    language: 'TypeScript',
    files: [
      {
        name: 'orderController.ts',
        path: 'src/controllers/orderController.ts',
        language: 'typescript',
        content: `import { Request, Response } from 'express';
import { db } from '../db/connection';
import jwt from 'jsonwebtoken';
import { processStripePayment } from '../services/paymentService';

const JWT_SECRET = 'hardcoded_jwt_secret_key_12345'; // Anti-pattern: Hardcoded secret

export async function createOrder(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing token' });
    }
    
    // Security flaw: verification without algorithm specification
    const user: any = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
    
    const { items, paymentMethodId, discountCode } = req.body;
    
    // Vulnerability: Direct SQL string interpolation (SQL Injection)
    const discountQuery = \`SELECT * FROM discounts WHERE code = '\${discountCode}' AND active = true\`;
    const discountResult = await db.query(discountQuery);
    
    let total = 0;
    // Performance Smell: N+1 query pattern inside loop without batching
    for (const item of items) {
      const product = await db.query(\`SELECT price, inventory FROM products WHERE id = \${item.productId}\`);
      total += product.rows[0].price * item.quantity;
    }
    
    // Payment execution without distributed idempotent key
    const payment = await processStripePayment(user.id, total, paymentMethodId);
    
    // Flaw: No database transaction rollback if receipt generation fails
    const order = await db.query(
      'INSERT INTO orders (user_id, amount, status, charge_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [user.id, total, 'PAID', payment.chargeId]
    );

    return res.status(201).json({ orderId: order.rows[0].id, status: 'success' });
  } catch (err: any) {
    // Security flaw: Leaking raw internal stack traces to client
    return res.status(500).json({ error: 'Internal Server Error', stack: err.stack });
  }
}
`
      },
      {
        name: 'paymentService.ts',
        path: 'src/services/paymentService.ts',
        language: 'typescript',
        content: `import axios from 'axios';

// Missing circuit breaker & timeout configuration
export async function processStripePayment(userId: string, amount: number, paymentMethodId: string) {
  const stripeUrl = 'https://api.stripe.com/v1/charges';
  
  // Anti-pattern: Tight coupling with synchronous HTTP calls without retry or fallback
  const response = await axios.post(stripeUrl, {
    amount: amount * 100,
    currency: 'usd',
    customer: userId,
    source: paymentMethodId,
  }, {
    headers: {
      'Authorization': \`Bearer \${process.env.STRIPE_SECRET_KEY}\`
    }
  });

  return { chargeId: response.data.id, status: response.data.status };
}
`
      }
    ]
  },
  {
    id: 'rag-ingestion-pipeline',
    name: 'AI Document Parsing & RAG Ingestion Pipeline',
    description: 'Python FastAPI service processing PDF/DOCX files, vector embeddings, and shell utilities.',
    category: 'AI & Data Engineering',
    language: 'Python',
    files: [
      {
        name: 'ingest_router.py',
        path: 'api/routers/ingest_router.py',
        language: 'python',
        content: `import os
import subprocess
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.vector_store import embed_and_upsert

router = APIRouter(prefix="/v1/documents")

# Global memory buffer holding un-evicted documents (Memory Leak smell)
DOCUMENT_CACHE = []

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), extract_ocr: bool = False):
    file_bytes = await file.read()
    temp_path = f"/tmp/{file.filename}"
    
    with open(temp_path, "wb") as f:
        f.write(file_bytes)
        
    DOCUMENT_CACHE.append(file_bytes) # Memory Leak: unbounded memory growth
    
    if extract_ocr:
        # CRITICAL VULNERABILITY: Unsanitized command injection via filename
        cmd = f"tesseract {temp_path} stdout"
        output = os.popen(cmd).read()
    else:
        output = file_bytes.decode("utf-8", errors="ignore")
        
    # Unhandled async task without worker pool
    try:
        embed_and_upsert(file.filename, output)
    except Exception as e:
        # Anti-pattern: Silent error swallowing
        pass

    return {"filename": file.filename, "status": "processed", "length": len(output)}
`
      },
      {
        name: 'vector_store.py',
        path: 'services/vector_store.py',
        language: 'python',
        content: `import time

def embed_and_upsert(doc_id: str, text: str):
    # Missing batching and rate limiter for embedding API
    chunks = [text[i:i+500] for i in range(0, len(text), 500)]
    
    for chunk in chunks:
        # Simulated synchronous blocking call in async context
        time.sleep(0.05)
        # Vector insertion without connection pooling
`
      }
    ]
  },
  {
    id: 'healthcare-patient-portal',
    name: 'Patient Health Records API & Telehealth Service',
    description: 'Next.js App Router API with patient history, medical imaging metadata, and role verification.',
    category: 'Healthcare & HIPAA',
    language: 'TypeScript',
    files: [
      {
        name: 'route.ts',
        path: 'app/api/patient/[patientId]/records/route.ts',
        language: 'typescript',
        content: `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  // CRITICAL VULNERABILITY: Insecure Direct Object Reference (IDOR) / Broken Object Level Auth
  // Missing validation that the authenticated user owns or is authorized to view params.patientId
  const records = await prisma.medicalRecord.findMany({
    where: {
      patientId: params.patientId
    },
    include: {
      prescriptions: true,
      labResults: true
    }
  });

  // Anti-pattern: Returning sensitive PII/PHI (SSN, insurance credentials) directly
  return NextResponse.json({ records });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  const body = await req.json();
  const { doctorNotes, diagnosis } = body;

  // Vulnerability: Stored Cross-Site Scripting (XSS) via unescaped clinical notes
  const record = await prisma.medicalRecord.create({
    data: {
      patientId: params.patientId,
      diagnosis,
      doctorNotes: doctorNotes, // Unsanitized HTML/Script payload
      createdAt: new Date()
    }
  });

  return NextResponse.json({ success: true, recordId: record.id });
}
`
      }
    ]
  }
];

export const SAMPLE_INITIAL_AUDIT: AuditResult = {
  id: 'audit-run-ecom-001',
  timestamp: new Date().toISOString(),
  repoName: 'E-Commerce Order & Payment Microservice',
  executionTimeMs: 1420,
  modelUsed: 'gemini-3.7-flash',
  scannedFilesCount: 2,
  summary: {
    overallHealthScore: 42,
    cyclomaticComplexity: 'High',
    maintainabilityScore: 48,
    securityScore: 35,
    totalVulnerabilities: 4,
    totalCodeSmells: 3,
    severityCounts: {
      critical: 2,
      high: 1,
      medium: 1,
      low: 0,
      info: 0
    },
    keyTakeaways: [
      'Critical SQL Injection vulnerability discovered in orderController.ts discount query.',
      'Hardcoded JWT Secret violates cryptographic storage standards (OWASP A02:2021).',
      'N+1 synchronous query loop in price calculation causes severe database lockup under load.',
      'Lack of database transactions leaves payment states out of sync upon unhandled exceptions.'
    ]
  },
  architecture: {
    diagramType: 'graph TD',
    mermaidDefinition: `graph TD
    Client[Web & Mobile Client] -->|Bearer JWT| Gateway[API Gateway / Ingress]
    Gateway -->|HTTP POST /orders| OrderCtrl[orderController.ts]
    OrderCtrl -->|Unparameterized SQL| DB[(PostgreSQL Database)]
    OrderCtrl -->|Sync HTTP REST| PaymentSvc[paymentService.ts]
    PaymentSvc -->|Stripe API Keys| Stripe[Stripe Payment Gateway]
    
    subgraph Security Boundary Flaws
      OrderCtrl -.->|Hardcoded Secrets| KeyRing[Vulnerable Memory]
      OrderCtrl -.->|Uncaught Stack Traces| Client
    end
    
    style OrderCtrl fill:#3b0764,stroke:#a855f7,stroke-width:2px,color:#fff
    style DB fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
    style Stripe fill:#0f172a,stroke:#38bdf8,stroke-width:1px,color:#fff
    style KeyRing fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff`,
    components: [
      {
        name: 'OrderController',
        type: 'Controller',
        description: 'Handles HTTP requests for customer order placement and invoice creation.',
        dependencies: ['db/connection', 'paymentService', 'jsonwebtoken']
      },
      {
        name: 'PaymentService',
        type: 'External Adapter',
        description: 'Communicates with Stripe payment processor over synchronous HTTP requests.',
        dependencies: ['axios']
      },
      {
        name: 'PostgreSQL Database',
        type: 'Storage',
        description: 'Stores user accounts, inventory catalog, discounts, and order ledgers.',
        dependencies: []
      }
    ],
    dataFlows: [
      { source: 'Client', target: 'OrderController', action: 'Submit Order Request', protocol: 'HTTPS / JSON' },
      { source: 'OrderController', target: 'PostgreSQL', action: 'Fetch Discount & Products', protocol: 'TCP SQL' },
      { source: 'OrderController', target: 'PaymentService', action: 'Execute Payment', protocol: 'Internal Method' },
      { source: 'PaymentService', target: 'Stripe API', action: 'Charge Credit Card', protocol: 'HTTPS REST' }
    ],
    architectureRisks: [
      'Synchronous payment coupling blocks database worker threads during Stripe latency spikes.',
      'Missing 2-Phase Commit or SAGA pattern risks orphan credit card charges if DB insertion fails.',
      'Lack of API Gateway rate limiting leaves discount endpoint open to brute-force voucher farming.'
    ]
  },
  securityAudit: [
    {
      id: 'SEC-001',
      title: 'SQL Injection in Discount Voucher Verification',
      owaspCategory: 'A03:2021 - Injection',
      severity: 'Critical',
      filePath: 'src/controllers/orderController.ts',
      lineStart: 21,
      lineEnd: 23,
      vulnerableCode: `const discountQuery = \`SELECT * FROM discounts WHERE code = '\${discountCode}' AND active = true\`;
const discountResult = await db.query(discountQuery);`,
      description: 'User input from req.body.discountCode is directly concatenated into the SQL statement without parameterized escaping.',
      impact: 'Attacker can bypass discount validation, extract hashed passwords, or drop tables using SQL syntax such as "\' OR \'1\'=\'1".',
      remediationCode: `// Use parameterized placeholders ($1, $2) to safely bind inputs
const discountQuery = 'SELECT * FROM discounts WHERE code = $1 AND active = true';
const discountResult = await db.query(discountQuery, [discountCode]);`,
      remediationSteps: [
        'Replace template literal string interpolation with positional query parameters ($1, $2).',
        'Enforce strict regex validation on discount vouchers before reaching the data access layer.',
        'Apply principle of least privilege to database role permissions.'
      ],
      cwe: 'CWE-89'
    },
    {
      id: 'SEC-002',
      title: 'Hardcoded Cryptographic Secret in Source Code',
      owaspCategory: 'A02:2021 - Cryptographic Failures',
      severity: 'Critical',
      filePath: 'src/controllers/orderController.ts',
      lineStart: 6,
      lineEnd: 6,
      vulnerableCode: `const JWT_SECRET = 'hardcoded_jwt_secret_key_12345';`,
      description: 'Static JWT signing secret key is defined directly in version-controlled source code.',
      impact: 'Any actor with read access to the repository can forge arbitrary authentication tokens and impersonate administrators.',
      remediationCode: `// Load secret from secured environment variables or Secret Manager
const JWT_SECRET = process.env.JWT_SIGNING_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SIGNING_SECRET environment variable is not configured');
}`,
      remediationSteps: [
        'Move the secret to environment variables or Google Cloud Secret Manager.',
        'Rotate all existing production JWT signing keys immediately.',
        'Add pre-commit git hooks with secret scanning (e.g. TruffleHog).'
      ],
      cwe: 'CWE-798'
    },
    {
      id: 'SEC-003',
      title: 'Detailed Server Stack Trace Leakage',
      owaspCategory: 'A05:2021 - Security Misconfiguration',
      severity: 'High',
      filePath: 'src/controllers/orderController.ts',
      lineStart: 42,
      lineEnd: 43,
      vulnerableCode: `return res.status(500).json({ error: 'Internal Server Error', stack: err.stack });`,
      description: 'Uncaught exceptions return the full runtime call stack, including internal file paths, framework versions, and database topology.',
      impact: 'Provides reconnaissance data to malicious actors detailing system internals and directory structures.',
      remediationCode: `// Log stack trace internally to telemetry, return sanitized error message to client
logger.error('Order creation failed', { error: err.message, stack: err.stack });
return res.status(500).json({ 
  error: 'An error occurred while processing your order. Please try again.',
  code: 'ORDER_PROCESSING_FAILED'
});`,
      remediationSteps: [
        'Sanitize all HTTP 500 error payloads in production.',
        'Route comprehensive stack traces to private SIEM or Datadog loggers.'
      ],
      cwe: 'CWE-209'
    },
    {
      id: 'SEC-004',
      title: 'Unverified JWT Algorithm Header',
      owaspCategory: 'A07:2021 - Identification and Authentication Failures',
      severity: 'Medium',
      filePath: 'src/controllers/orderController.ts',
      lineStart: 16,
      lineEnd: 16,
      vulnerableCode: `const user: any = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);`,
      description: 'JWT verification does not enforce allowed cryptographic algorithms (e.g. HS256/RS256), enabling "none" algorithm exploit bypass.',
      impact: 'Adversary can construct a modified payload with "alg": "none" and bypass authentication checks.',
      remediationCode: `const user = jwt.verify(token, JWT_SECRET, {
  algorithms: ['HS256']
});`,
      remediationSteps: [
        'Explicitly whitelist allowed algorithms in jwt.verify options array.',
        'Ensure token expiration (exp) and issuer (iss) claims are verified.'
      ],
      cwe: 'CWE-347'
    }
  ],
  codeSmells: [
    {
      id: 'SMELL-001',
      title: 'N+1 Sequential Database Query in Loop',
      category: 'Performance Bottleneck',
      severity: 'High',
      filePath: 'src/controllers/orderController.ts',
      lineStart: 26,
      lineEnd: 30,
      snippet: `for (const item of items) {
  const product = await db.query(\`SELECT price, inventory FROM products WHERE id = \${item.productId}\`);
  total += product.rows[0].price * item.quantity;
}`,
      explanation: 'Iterating through order items and issuing a separate synchronous database round-trip for each product creates an N+1 query bottleneck.',
      refactoredCode: `// Batch fetch all products in a single SQL query
const productIds = items.map((i: any) => i.productId);
const productsResult = await db.query(
  'SELECT id, price, inventory FROM products WHERE id = ANY($1)',
  [productIds]
);
const productMap = new Map(productsResult.rows.map((p: any) => [p.id, p]));

for (const item of items) {
  const product = productMap.get(item.productId);
  if (!product) throw new Error(\`Product \${item.productId} not found\`);
  total += product.price * item.quantity;
}`,
      benefits: [
        'Reduces database round-trips from O(N) to O(1).',
        'Significantly decreases endpoint latency during high volume multi-item checkouts.',
        'Prevents database connection pool exhaustion.'
      ]
    },
    {
      id: 'SMELL-002',
      title: 'Missing Atomic Database Transaction Rollback',
      category: 'Anti-Pattern',
      severity: 'High',
      filePath: 'src/controllers/orderController.ts',
      lineStart: 32,
      lineEnd: 39,
      snippet: `const payment = await processStripePayment(user.id, total, paymentMethodId);
const order = await db.query(
  'INSERT INTO orders (user_id, amount, status, charge_id) VALUES ($1, $2, $3, $4) RETURNING id',
  [user.id, total, 'PAID', payment.chargeId]
);`,
      explanation: 'Money is charged via Stripe before recording the order in the database. If the DB INSERT query crashes or times out, the customer is billed with no record created.',
      refactoredCode: `// Use Database Client Transaction & Idempotency Key
const client = await db.getClient();
try {
  await client.query('BEGIN');
  const order = await client.query(
    'INSERT INTO orders (user_id, amount, status) VALUES ($1, $2, $3) RETURNING id',
    [user.id, total, 'PENDING_PAYMENT']
  );
  
  // Use DB order ID as Stripe idempotency key
  const payment = await processStripePayment(user.id, total, paymentMethodId, {
    idempotencyKey: \`order_\${order.rows[0].id}\`
  });
  
  await client.query('UPDATE orders SET status = $1, charge_id = $2 WHERE id = $3', [
    'PAID', payment.chargeId, order.rows[0].id
  ]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}`,
      benefits: [
        'Guarantees consistency between payment gateway charges and internal orders.',
        'Prevents ghost charges and financial balance discrepancy.'
      ]
    },
    {
      id: 'SMELL-003',
      title: 'Missing Circuit Breaker & Timeout on Third-Party Payment Call',
      category: 'Tight Coupling',
      severity: 'Medium',
      filePath: 'src/services/paymentService.ts',
      lineStart: 7,
      lineEnd: 17,
      snippet: `const response = await axios.post(stripeUrl, { ... });`,
      explanation: 'Axios request has no timeout set and is directly coupled without an exponential retry backoff or circuit breaker policy.',
      refactoredCode: `const response = await axios.post(stripeUrl, payload, {
  headers: { 'Authorization': \`Bearer \${process.env.STRIPE_SECRET_KEY}\` },
  timeout: 5000 // 5 seconds max timeout
});`,
      benefits: [
        'Prevents thread hanging if third-party payment gateway experiences network lag.',
        'Enables graceful timeout handling and user notification.'
      ]
    }
  ],
  astMetrics: {
    totalLinesOfCode: 78,
    totalFunctions: 2,
    totalClassesOrModules: 2,
    estimatedTokenCount: 680,
    astReductionPercentage: 64,
    languageBreakdown: {
      'TypeScript': 100
    }
  }
};
