/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MITRE CWE Top 25 Most Dangerous Software Weaknesses (2025/2026 Ranking)
 * Derived from empirical analysis of public CVE records and National Vulnerability Database (NVD)
 * root-cause mappings to Common Weakness Enumeration (CWE).
 */

export interface CWETop25Entry {
  rank: number;
  cweId: string;
  name: string;
  shortName: string;
  bugClass: 'Input Neutralization' | 'Access & Authorization' | 'Memory Safety' | 'Cryptography & Secrets' | 'Concurrency & Resources' | 'Code Execution & Logic';
  score: number;
  description: string;
  keyRisks: string[];
  mitigation: string;
}

export const CWE_TOP_25_2025: CWETop25Entry[] = [
  {
    rank: 1,
    cweId: 'CWE-79',
    name: 'Improper Neutralization of Input During Web Page Generation (Cross-site Scripting)',
    shortName: 'Cross-Site Scripting (XSS)',
    bugClass: 'Input Neutralization',
    score: 63.56,
    description: 'The software does not neutralize or incorrectly neutralizes user-controllable input before it is placed in output that is used as a web page that is served to other users.',
    keyRisks: ['Session Hijacking', 'Credential Harvesting', 'DOM Defacement', 'CSRF Relay'],
    mitigation: 'Context-aware output encoding, Content-Security-Policy (CSP), and sanitized DOM rendering (DOMPurify).'
  },
  {
    rank: 2,
    cweId: 'CWE-89',
    name: 'Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)',
    shortName: 'SQL Injection (SQLi)',
    bugClass: 'Input Neutralization',
    score: 52.88,
    description: 'The software constructs all or part of an SQL command using externally-influenced input from an upstream component, but it does not neutralize or incorrectly neutralizes special elements that could modify the intended SQL command.',
    keyRisks: ['Full Database Exfiltration', 'Authentication Bypass', 'Data Tampering / Loss', 'RCE via xp_cmdshell / UDF'],
    mitigation: 'Parameterized queries with prepared statements, type-safe ORMs, and least-privilege DB users.'
  },
  {
    rank: 3,
    cweId: 'CWE-352',
    name: 'Cross-Site Request Forgery (CSRF)',
    shortName: 'Cross-Site Request Forgery (CSRF)',
    bugClass: 'Access & Authorization',
    score: 41.20,
    description: 'The web application does not, or can not, sufficiently verify whether a well-formed, valid, consistent request was intentionally provided by the user who submitted the request.',
    keyRisks: ['Unauthorized Fund Transfer', 'Password / Email Change', 'Admin Account Creation', 'State Mutation'],
    mitigation: 'SameSite=Strict/Lax cookies, anti-CSRF token synchronization (double-submit / synchronizer tokens), Custom HTTP header validation.'
  },
  {
    rank: 4,
    cweId: 'CWE-862',
    name: 'Missing Authorization',
    shortName: 'Missing Authorization (IDOR)',
    bugClass: 'Access & Authorization',
    score: 38.64,
    description: 'The software does not perform an authorization check when an actor attempts to access a resource or perform an action.',
    keyRisks: ['Direct Object Reference Bypass (IDOR)', 'Horizontal Privilege Escalation', 'Tenant Isolation Breach'],
    mitigation: 'Enforce centralized policy-based authorization (ABAC/RBAC) at the domain layer; check actor ownership on every entity query.'
  },
  {
    rank: 5,
    cweId: 'CWE-787',
    name: 'Out-of-bounds Write',
    shortName: 'Out-of-bounds Write',
    bugClass: 'Memory Safety',
    score: 35.12,
    description: 'The software writes data past the end, or before the beginning, of the intended buffer.',
    keyRisks: ['Memory Corruption', 'Remote Code Execution (RCE)', 'Denial of Service / Crash', 'Instruction Pointer Hijacking'],
    mitigation: 'Use memory-safe languages (Rust, Go, TypeScript), bounded buffer operations (snprintf, strlcpy), and compiler ASLR/DEP/Canaries.'
  },
  {
    rank: 6,
    cweId: 'CWE-22',
    name: 'Improper Limitation of a Pathname to a Restricted Directory (Path Traversal)',
    shortName: 'Path Traversal (LFI/RFI)',
    bugClass: 'Input Neutralization',
    score: 31.45,
    description: 'The software uses external input to construct a pathname that is intended to identify a file or directory located underneath a restricted parent directory, but does not properly neutralize sequences such as "..".',
    keyRisks: ['Arbitrary File Read (/etc/shadow)', 'Source Code Disclosure', 'Arbitrary File Overwrite'],
    mitigation: 'Canonicalize paths with path.resolve(), ensure target.startsWith(BASE_DIRECTORY), or reference files by randomized opaque IDs.'
  },
  {
    rank: 7,
    cweId: 'CWE-287',
    name: 'Improper Authentication',
    shortName: 'Improper Authentication',
    bugClass: 'Access & Authorization',
    score: 29.80,
    description: 'When an actor claims to have a given identity, the software does not prove or insufficiently proves that the claim is correct.',
    keyRisks: ['Complete Identity Forgery', 'Multi-Factor Auth Bypass', 'Session Spoofing'],
    mitigation: 'Implement robust OAuth 2.0 / OpenID Connect flows, multi-factor authentication (MFA), and constant-time credential comparison.'
  },
  {
    rank: 8,
    cweId: 'CWE-434',
    name: 'Unrestricted Upload of File with Dangerous Type',
    shortName: 'Unrestricted File Upload',
    bugClass: 'Input Neutralization',
    score: 26.54,
    description: 'The software allows the attacker to upload or transfer files of dangerous types that can be directly executed within the server environment.',
    keyRisks: ['Web Shell Upload', 'Remote Code Execution', 'Server Compromise'],
    mitigation: 'Validate MIME type + magic bytes against an allowlist, rename uploads with randomized UUIDs, store in cloud object storage (S3/GCS) outside docroot.'
  },
  {
    rank: 9,
    cweId: 'CWE-78',
    name: 'Improper Neutralization of Special Elements used in an OS Command (OS Command Injection)',
    shortName: 'OS Command Injection',
    bugClass: 'Input Neutralization',
    score: 25.10,
    description: 'The software constructs an OS command using externally-influenced input, but it does not neutralize or incorrectly neutralizes special characters that could modify the command.',
    keyRisks: ['Full Host Takeover', 'Reverse Shell Spawn', 'Infrastructure Compromise'],
    mitigation: 'Avoid shell execution APIs (exec, system); use array-based binary invocation (execFile, subprocess.run) without invoking a shell.'
  },
  {
    rank: 10,
    cweId: 'CWE-125',
    name: 'Out-of-bounds Read',
    shortName: 'Out-of-bounds Read',
    bugClass: 'Memory Safety',
    score: 23.40,
    description: 'The software reads data past the end, or before the beginning, of the intended buffer.',
    keyRisks: ['Information Disclosure (Heartbleed style)', 'Sensitive Memory Leak', 'Crash / Denial of Service'],
    mitigation: 'Check array boundaries before indexing; utilize bounded stream readers and memory sanitizers.'
  },
  {
    rank: 11,
    cweId: 'CWE-502',
    name: 'Deserialization of Untrusted Data',
    shortName: 'Insecure Deserialization',
    bugClass: 'Code Execution & Logic',
    score: 21.80,
    description: 'The application deserializes untrusted data without sufficiently verifying that the resulting data will be valid.',
    keyRisks: ['Remote Code Execution', 'Object Injection', 'Memory Corruption'],
    mitigation: 'Avoid native serialization (pickle, Java serial, serialize-javascript); use pure data formats like JSON with strict schema validation.'
  },
  {
    rank: 12,
    cweId: 'CWE-798',
    name: 'Use of Hard-coded Credentials',
    shortName: 'Hard-coded Credentials',
    bugClass: 'Cryptography & Secrets',
    score: 20.90,
    description: 'The software contains hard-coded credentials, such as a password or cryptographic key, which it uses for its own inbound authentication or outbound communication.',
    keyRisks: ['Credential Leakage via Git', 'Admin Account Hijack', 'Supply Chain Compromise'],
    mitigation: 'Store all secrets in environment variables or cloud key vaults (GCP Secret Manager, AWS KMS, Vault); use git-secrets in CI/CD.'
  },
  {
    rank: 13,
    cweId: 'CWE-918',
    name: 'Server-Side Request Forgery (SSRF)',
    shortName: 'Server-Side Request Forgery (SSRF)',
    bugClass: 'Input Neutralization',
    score: 19.45,
    description: 'The web server receives a URL or similar request from an upstream component and retrieves the contents of this URL, but does not sufficiently ensure that the request is not directed at unintended destinations.',
    keyRisks: ['Cloud Metadata Exfiltration (169.254.169.254)', 'Internal VPC Port Scanning', 'Unauthenticated Microservice Access'],
    mitigation: 'Strict outbound URL domain allowlisting; block loopback (127.0.0.1) and private IP subnets (RFC 1918).'
  },
  {
    rank: 14,
    cweId: 'CWE-863',
    name: 'Incorrect Authorization',
    shortName: 'Incorrect Authorization',
    bugClass: 'Access & Authorization',
    score: 18.20,
    description: 'The software performs an authorization check when an actor attempts to access a resource or perform an action, but does not correctly perform the check.',
    keyRisks: ['Vertical Privilege Escalation', 'Role Confusion', 'Tenant Data Leakage'],
    mitigation: 'Centralize RBAC/ABAC verification in middleware with strict unit tests.'
  },
  {
    rank: 15,
    cweId: 'CWE-306',
    name: 'Missing Authentication for Critical Function',
    shortName: 'Missing Authentication',
    bugClass: 'Access & Authorization',
    score: 17.50,
    description: 'The software does not perform any authentication for functionality that requires a provable user identity or consumes significant resources.',
    keyRisks: ['Unauthenticated Admin Actions', 'Data Deletion', 'Service Disruption'],
    mitigation: 'Default-deny routing configuration; require authenticated session middleware on all non-public endpoints.'
  },
  {
    rank: 16,
    cweId: 'CWE-476',
    name: 'NULL Pointer Dereference',
    shortName: 'NULL Pointer Dereference',
    bugClass: 'Code Execution & Logic',
    score: 16.30,
    description: 'A NULL pointer dereference occurs when the application dereferences a pointer that it expects to be valid, but is NULL.',
    keyRisks: ['Process Crash', 'Denial of Service', 'Unexpected Branching'],
    mitigation: 'Use optional chaining (?.) and strict null checks (strictNullChecks in tsconfig.json).'
  },
  {
    rank: 17,
    cweId: 'CWE-20',
    name: 'Improper Input Validation',
    shortName: 'Improper Input Validation',
    bugClass: 'Input Neutralization',
    score: 15.80,
    description: 'The product receives input or data, but it does not validate or incorrectly validates that the input has the properties that are required to process the data safely.',
    keyRisks: ['Malformed Data Injection', 'Type Confusion', 'Downstream Invariant Violation'],
    mitigation: 'Validate all API request boundaries using strict schema parsing (Zod, TypeBox, Pydantic).'
  },
  {
    rank: 18,
    cweId: 'CWE-77',
    name: 'Improper Neutralization of Special Elements used in a Command (Command Injection)',
    shortName: 'Command Injection',
    bugClass: 'Input Neutralization',
    score: 14.90,
    description: 'The software constructs all or part of a command using externally-influenced input, leading to unauthorized command interpretation.',
    keyRisks: ['Subshell Hijack', 'Malicious Script Execution'],
    mitigation: 'Strict input whitelist and avoidance of shell concatenation.'
  },
  {
    rank: 19,
    cweId: 'CWE-119',
    name: 'Improper Restriction of Operations within the Bounds of a Memory Buffer',
    shortName: 'Buffer Overflow / Boundary Error',
    bugClass: 'Memory Safety',
    score: 13.70,
    description: 'The software performs operations on a memory buffer, but it can read from or write to a memory location that is outside of the intended boundary of the buffer.',
    keyRisks: ['Stack Smashing', 'Heap Exploitation', 'Arbitrary Code Execution'],
    mitigation: 'Use modern memory-managed runtimes and compile with stack canaries.'
  },
  {
    rank: 20,
    cweId: 'CWE-190',
    name: 'Integer Overflow or Wraparound',
    shortName: 'Integer Overflow',
    bugClass: 'Code Execution & Logic',
    score: 12.80,
    description: 'The software performs a calculation that can produce an integer value that is too large or too small to be stored in the integer representation.',
    keyRisks: ['Logic Flaw in Financial Calculation', 'Buffer Size Calculation Truncation'],
    mitigation: 'Use safe math libraries or BigInt / SafeMath primitives.'
  },
  {
    rank: 21,
    cweId: 'CWE-416',
    name: 'Use After Free',
    shortName: 'Use After Free (UAF)',
    bugClass: 'Memory Safety',
    score: 11.90,
    description: 'Referencing memory after it has been freed can cause a program to crash or execute arbitrary code.',
    keyRisks: ['Pointer Reallocation Exploit', 'Arbitrary Execution'],
    mitigation: 'Set freed pointers to NULL immediately; utilize RAII / smart pointers or memory-safe languages.'
  },
  {
    rank: 22,
    cweId: 'CWE-94',
    name: 'Improper Control of Generation of Code (Code Injection)',
    shortName: 'Code Injection (eval / Function)',
    bugClass: 'Code Execution & Logic',
    score: 11.20,
    description: 'The software constructs all or part of a code segment using externally-influenced input, but does not neutralize special elements that could alter the code syntax.',
    keyRisks: ['Arbitrary Server Execution', 'Complete Sandbox Escape'],
    mitigation: 'Strictly forbid eval(), new Function(), vm.runInThisContext() with untrusted strings.'
  },
  {
    rank: 23,
    cweId: 'CWE-269',
    name: 'Improper Privilege Management',
    shortName: 'Privilege Escalation',
    bugClass: 'Access & Authorization',
    score: 10.50,
    description: 'The software does not properly assign, modify, track, or check privileges for an actor, creating an unintended sphere of control for that actor.',
    keyRisks: ['Unintended Superuser Elevation', 'Security Control Deactivation'],
    mitigation: 'Principle of least privilege (PoLP) and immutable role scopes.'
  },
  {
    rank: 24,
    cweId: 'CWE-362',
    name: 'Concurrent Execution using Shared Resource with Improper Synchronization (Race Condition)',
    shortName: 'Race Condition (TOCTOU)',
    bugClass: 'Concurrency & Resources',
    score: 9.80,
    description: 'The program can execute multiple concurrent sequences of operations on a shared resource without adequate synchronization.',
    keyRisks: ['Double-Spending Flaws', 'TOCTOU Privilege Check Bypass', 'Corrupted State'],
    mitigation: 'Database transactions with row locking (SELECT FOR UPDATE) or atomic Redis distributed locks (Redlock).'
  },
  {
    rank: 25,
    cweId: 'CWE-770',
    name: 'Allocation of Resources Without Limits or Throttling',
    shortName: 'Missing Rate Limiting / Resource Limits',
    bugClass: 'Concurrency & Resources',
    score: 9.10,
    description: 'The software allocates resources (such as memory, CPU, or connections) on behalf of an actor without limits or throttling.',
    keyRisks: ['Denial of Service (DoS)', 'Memory Exhaustion Crash', 'Financial Exhaustion'],
    mitigation: 'Implement IP/token rate-limiting middleware (express-rate-limit), pagination on queries, and request body size caps.'
  }
];

// Map lookup by CWE string (e.g. "CWE-79" or "79")
export function getCWETop25Entry(cweString?: string): CWETop25Entry | undefined {
  if (!cweString) return undefined;
  const match = cweString.match(/CWE[-_]?(\d+)/i);
  if (!match) return undefined;
  const normalizedId = `CWE-${match[1]}`;
  return CWE_TOP_25_2025.find((item) => item.cweId.toUpperCase() === normalizedId.toUpperCase());
}
