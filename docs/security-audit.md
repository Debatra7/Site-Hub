# SaaS Security Audit

Scope: OAuth, token/session security, local-first IndexedDB data, shared boards, admin analytics, XSS/CSRF/SQL injection, sync tampering, and browser extension risks.

## 1. Risk Matrix

| Area | Risk | Likelihood | Impact | Severity | Current State | Required Control |
| --- | --- | --- | --- | --- | --- | --- |
| OAuth | Account linking takeover through unverified provider email or provider id mismatch | Medium | Critical | High | OAuth accounts modeled; controller not implemented | Match on provider account id, require verified email, explicit link flow |
| OAuth | Missing `state`/PKCE allows callback forgery | Medium | High | High | Routes scaffolded only | Signed `state`, PKCE, nonce, short expiry |
| Token security | Access/refresh tokens stolen from JS storage | Medium | Critical | High | JWT bearer middleware scaffolded | HTTP-only secure cookies or memory-only access token; hashed refresh tokens |
| Session hijacking | Reused refresh token not detected | Medium | Critical | High | Refresh token rotation modeled | Token family rotation and reuse revocation |
| IndexedDB | Local data readable by XSS or compromised device | Medium | High | High | Dexie schema implemented; no encryption layer | Per-account WebCrypto encryption for sensitive payload fields |
| Shared boards | Public token enumeration or oversharing private data | Medium | High | High | Share token hash modeled | Long random tokens, hashed storage, permission filters, abuse limits |
| Admin abuse | Admin views expose private URLs/notes/tokens | Low | Critical | High | Admin routes scaffolded | RBAC, audit logs, aggregation, step-up auth |
| XSS | Stored XSS in note content, tags, metadata, titles | High | Critical | Critical | Zod validates shape, not sanitization | Sanitization, CSP, safe rendering, no raw HTML |
| CSRF | Cookie-authenticated writes can be forged | Medium | High | High | Header allow-list includes CSRF token; middleware not implemented | SameSite cookies plus double-submit or synchronizer token |
| SQL injection | Unsafe raw queries in future services | Low | High | Medium | Prisma planned | Avoid raw SQL; parameterize and review raw query usage |
| Sync tampering | Client submits forged owner id/version/entity payload | High | Critical | Critical | Sync schemas validate shape | Server ownership checks, version checks, idempotency, conflict logs |
| Browser extension | Overbroad permissions leak browsing data | Medium | High | High | Extension not implemented | Minimal Manifest V3 permissions and short-lived auth |
| Metadata fetch | SSRF against localhost/private networks | Medium | High | High | Endpoint scaffolded only | SSRF-safe fetch gateway and denylist private IP ranges |
| Import/export | Malicious JSON import or data exfiltration abuse | Medium | High | High | Routes scaffolded | Strict schemas, rate limits, export audit, expiring artifacts |

## 2. Prevention Plan

- OAuth:
  - Use provider account id as the stable identity key.
  - Require verified email before account linking.
  - Store OAuth access and refresh tokens encrypted at rest.
  - Use signed `state`, nonce, and PKCE where supported.
- Tokens and sessions:
  - Store session token hashes server-side.
  - Rotate refresh tokens and detect reuse by token family.
  - Bind sessions to device records and expose logout-all.
  - Keep access tokens short-lived.
- IndexedDB:
  - Treat IndexedDB as private but not secure against XSS.
  - Encrypt sensitive content fields with WebCrypto.
  - Keep encryption keys out of persistent JS-readable storage when possible.
- Shared boards:
  - Generate at least 128-bit random share tokens.
  - Store only token hashes.
  - Rate-limit public token reads.
  - Filter private notes/cards/tags from shared responses unless explicitly shared.
- Admin:
  - Require `ADMIN` role plus step-up authentication for exports/security pages.
  - Audit every admin read and export.
  - Prefer aggregates over raw user content.
- XSS:
  - Sanitize rich note content and imported metadata.
  - Render text as text; avoid `dangerouslySetInnerHTML`.
  - Maintain CSP through Helmet.
- CSRF:
  - If cookies are used for auth, enforce SameSite and CSRF tokens on writes.
  - Bearer-only extension calls should require explicit Authorization headers.
- Sync:
  - Ignore client-supplied owner ids.
  - Validate every entity belongs to the authenticated user or shared board permission scope.
  - Require base version and idempotency key.
  - Record conflicts instead of overwriting stale updates.
- Extension:
  - Use `activeTab` and context-menu permissions, not broad host permissions.
  - Do not store refresh tokens in extension storage.
  - Use short-lived extension tokens and server-side revocation.

## 3. Secure Architecture Upgrades

Implemented baseline:

- Helmet secure headers and baseline CSP in `server/src/middleware/security.ts`.
- CORS origin allow-list through `CORS_ORIGINS`.
- JSON body limit set to `1mb`.
- Existing Zod validation middleware and route-specific rate limits.
- Prisma schema includes sessions, refresh tokens, audit logs, security events, conflicts, entity versions, and hashed share-token fields.

Next upgrades:

- Add CSRF middleware before enabling cookie-authenticated writes.
- Add WebCrypto helpers for encrypted Dexie fields.
- Add SSRF-safe metadata fetch service.
- Add audit-write helper used by auth, sharing, export, admin, and sync services.
- Add centralized ownership guards for Prisma service methods.
- Add admin step-up auth middleware.
- Add browser extension auth exchange with short-lived scoped tokens.
- Add dependency/security CI checks: `npm audit`, secret scanning, and Prisma migration validation.

## 4. Compliance Considerations

- Data portability:
  - Keep JSON export for account, category, notes, settings, and tags.
  - Track export jobs and audit who requested them.
- Right to deletion:
  - Support account soft delete followed by delayed hard delete.
  - Delete or anonymize analytics where legally required.
- Data minimization:
  - Do not collect raw private note content in analytics.
  - Avoid storing full sensitive URLs in security logs.
- Consent and transparency:
  - Document analytics collection and shared-board visibility.
  - Make sharing permissions visible and revocable.
- Retention:
  - Define retention windows for sessions, refresh tokens, audit logs, security events, analytics events, sync history, and export artifacts.
- Incident response:
  - Security events should support severity, resolution timestamp, and investigation metadata.
  - Token family reuse should trigger session revocation and user notification.
