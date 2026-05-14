# Database Architecture

This schema is normalized for PostgreSQL and implemented in `server/prisma/schema.prisma`.

## 1. ERD Structure

```text
User
  1--1 UserPreference
  1--* OAuthAccount
  1--* SyncDevice
  1--* Session
  1--* RefreshToken
  1--* Category
  1--* Website
  1--* StickyNote
  1--* Tag
  1--* MediaAsset
  1--* SharedBoard
  1--* SyncOperation
  1--* EntityVersion
  1--* ConflictLog
  1--* ImportJob
  1--* ExportJob
  1--* AnalyticsEvent
  1--* AuditLog
  1--* SecurityEvent

Category
  1--* Website
  1--* StickyNote
  1--* SharedBoard
  *--* Tag through CategoryTag

Website
  *--* Tag through WebsiteTag
  *--0..1 MediaAsset for thumbnail/custom icon

StickyNote
  *--* Tag through StickyNoteTag

SharedBoard
  *--1 Category
  1--* SharedBoardMember

SyncDevice
  1--* Session
  1--* RefreshToken
  1--* SyncOperation
  1--* ConflictLog

SyncOperation
  1--* ConflictLog
```

## 2. Table-by-Table Schema

### Users and Authentication

- `User`: canonical account, role, status, email, display name, avatar, active wallpaper/media, soft deletion.
- `OAuthAccount`: linked OAuth providers per user, provider account id, encrypted OAuth tokens, scopes, expiry, last-used timestamp.
- `UserPreference`: theme, accent color, layout, dashboard config, and privacy defaults.
- `SyncDevice`: registered client/device for account switching and sync identity.
- `Session`: hashed session token, device association, status, expiry, revocation, last seen.
- `RefreshToken`: hashed refresh token rotation with token families and replacement links.

### Core Product Data

- `Category`: user-owned board/category with icon, wallpaper media, visibility, order, version, and soft deletion.
- `Website`: user/category-owned website card with normalized URL, metadata, favicon, media references, pin/order state, version, and soft deletion.
- `StickyNote`: dashboard or category-scoped note with typed JSON content, layout coordinates, reminder state, visibility, version, and soft deletion.
- `Tag`: user-scoped freeform tags with normalized unique name and optional color.
- `WebsiteTag`, `StickyNoteTag`, `CategoryTag`: explicit many-to-many join tables.
- `MediaAsset`: uploaded wallpaper/icon/thumbnail/media metadata with owner, storage key, MIME type, dimensions, checksum, and visibility.

### Sharing and Privacy

- `SharedBoard`: hashed share token, owner, category, default permission, status, discovery flag, expiry, revocation.
- `SharedBoardMember`: per-user shared board membership and permission.

### Sync and Version History

- `SyncOperation`: idempotent client mutations with entity type/id, base/client/server versions, payload, status, and error fields.
- `EntityVersion`: immutable entity snapshots by version for history, rollback, and conflict comparison.
- `ConflictLog`: client/server snapshots, versions, status, and selected resolution.

### Analytics, Jobs, and Compliance

- `AnalyticsEvent`: append-only event stream for admin analytics across web app, PWA, extension, server, and admin.
- `AnalyticsAggregate`: materialized metrics for dashboards.
- `ImportJob`: import source, status, conflict strategy, file metadata, summary, and errors.
- `ExportJob`: export scope, status, generated artifact metadata, expiry, and errors.
- `AuditLog`: security/compliance audit trail with actor, action, entity, before/after JSON, and request metadata.
- `SecurityEvent`: failed login, rate-limit, suspicious activity, session anomaly, and abuse events.

## 3. Relationships

- A `User` can link many `OAuthAccount` rows, enabling multi-provider login without duplicating product data.
- Fast account switching uses `SyncDevice`, `Session`, and `RefreshToken` records scoped by `userId`; clients can keep separate local IndexedDB profiles keyed by user/device.
- Categories, websites, sticky notes, tags, media, sync records, and jobs are user-owned for direct authorization checks.
- Websites belong to one category, while sticky notes may be global (`categoryId = null`) or category-specific.
- Tags are not embedded arrays; they are normalized through join tables so websites, notes, and categories can all share the same user-defined tag vocabulary.
- Shared boards reference categories and grant access through token-based links and optional `SharedBoardMember` rows.
- Sync records are polymorphic through `EntityType` plus `entityId`, avoiding nullable foreign-key sprawl while preserving version history for every synced entity.

## 4. Indexing Strategy

- Ownership and authorization: index `userId` on user-owned tables and composite indexes like `Category(userId, orderIndex)`, `Website(userId, updatedAt)`, and `StickyNote(userId, updatedAt)`.
- Uniqueness: enforce `User.email`, `OAuthAccount(provider, providerAccountId)`, `Tag(userId, normalizedName)`, `Website(categoryId, normalizedUrl)`, and `SyncOperation(userId, idempotencyKey)`.
- Sync performance: index `SyncOperation(userId, createdAt)`, `SyncOperation(userId, entityType, entityId)`, `EntityVersion(userId, entityType, entityId)`, and conflict status indexes.
- Sharing: unique hashed share tokens and indexes on `SharedBoard(ownerId, status)`, `SharedBoard(categoryId)`, and expiry.
- Sessions: index active sessions by `Session(userId, status)`, expiry, and device id.
- Analytics: index event name/source/user by `occurredAt`; aggregate tables use unique metric/granularity/bucket keys.
- Soft deletion: `deletedAt` indexes support cleanup jobs and filtered active-data queries.

## 5. Scalability Considerations

- Keep high-volume analytics append-only and aggregate into `AnalyticsAggregate` for dashboard reads.
- Partition or archive `AnalyticsEvent`, `AuditLog`, `SecurityEvent`, `SyncOperation`, and `EntityVersion` by time once volume grows.
- Use cursor-based sync on server timestamps or monotonically increasing version cursors instead of offset pagination.
- Store media in object storage; keep only metadata and ownership references in PostgreSQL.
- Keep JSON fields for flexible payloads, but use normalized columns for query-critical values like `userId`, `categoryId`, `visibility`, `status`, and timestamps.
- Use background jobs for import/export, sync conflict cleanup, expired share revocation, session pruning, and analytics aggregation.
- Add PostgreSQL full-text or trigram indexes later for website/note search once search requirements stabilize.

## 6. Audit Logging Strategy

- Write `AuditLog` entries for login/logout, admin access, sharing changes, imports, exports, account deletion, session revocation, and privacy changes.
- Store `actorUserId` separately from `userId` so admin actions against another account remain attributable.
- Use `before` and `after` JSON snapshots for high-risk entities: privacy settings, shared boards, sessions, OAuth accounts, and account status.
- Write `SecurityEvent` for failed logins, suspicious token reuse, rate-limit violations, SSRF-blocked metadata fetches, export abuse, and shared-board abuse.
- Avoid storing raw secrets, OAuth tokens, refresh tokens, private note bodies, or full private URLs in audit logs unless a compliance requirement explicitly demands it.
- Retain audit/security logs longer than product analytics, with a documented retention window and export/delete compatibility.

## 7. Migration Strategy

1. Create the new normalized tables through Prisma migrations.
2. Backfill existing single-provider user data into `OAuthAccount`.
3. Move embedded preference JSON from `User.preferences` into `UserPreference`.
4. Normalize tag arrays or implicit relations into `Tag`, `WebsiteTag`, `StickyNoteTag`, and `CategoryTag`.
5. Add `userId`, `version`, `visibility`, and `deletedAt` values to syncable entities.
6. Create initial `EntityVersion` snapshots for existing categories, websites, sticky notes, tags, and shared boards.
7. Backfill current sessions into `Session` and issue new refresh tokens using hashed storage.
8. Deploy read paths compatible with both old and new data shape, then switch write paths to the new tables.
9. Run consistency checks for ownership, orphaned joins, duplicate normalized tags, duplicate normalized URLs, and share-token uniqueness.
10. Remove legacy columns only after production traffic and exports confirm the normalized schema is stable.
