# Local-first Sync Engine

This design uses IndexedDB as the source of truth on the client, Dexie.js as the local database layer, PostgreSQL/Prisma as the cloud replica, and free/low-cost background jobs plus browser APIs for sync orchestration.

## 1. Local DB Structure

The implemented Dexie schema lives in `client/src/lib/db.ts`.

### Primary Local Tables

- `categories`: category metadata, ordering, privacy visibility, version, sync status, soft deletion.
- `websites`: website cards, normalized URL, metadata, ordering, pin state, media refs, version, sync status, soft deletion.
- `stickyNotes`: dashboard/category notes, typed content JSON, position, size, reminders, visibility, version, sync status.
- `tags`: user-defined normalized tags with color, version, sync status.
- `entityTags`: normalized local join table for category, website, and sticky-note tags.
- `preferences`: theme, accent color, layout, dashboard config, privacy defaults.

### Sync Control Tables

- `syncQueue`: append-only local mutation queue with idempotency key, entity type/id, operation, base/client versions, payload, retry state, and status.
- `entityVersions`: immutable local snapshots for rollback, diff, and conflict comparison.
- `conflicts`: unresolved or resolved sync conflicts with client/server snapshots and chosen strategy.
- `syncCursors`: per-account/per-device pull cursor, last successful sync, online/syncing flags, and last error.
- `deviceProfiles`: stable client identity for multi-device sync and fast account switching.

All user-editable entities carry `syncStatus`, `version`, `updatedAt`, and optional `deletedAt`.

## 2. Sync Queue Lifecycle

1. User performs a write while online or offline.
2. App writes the entity update to IndexedDB in the same transaction as:
   - an `entityVersions` snapshot,
   - a `syncQueue` item,
   - an incremented local `version`,
   - `syncStatus = DIRTY` or `DELETED`.
3. A foreground sync trigger, service worker background sync, or reconnect event selects due queue items by `[status+nextAttemptAt]`.
4. Client sends a batch to `POST /sync/push` with idempotency keys, base versions, client versions, and payloads.
5. Server applies accepted operations, records `SyncOperation` and `EntityVersion`, and returns accepted versions, rejected operations, or conflicts.
6. Client marks accepted queue rows `APPLIED`, updates entities to `SYNCED`, stores server version/cursor, and prunes old applied queue rows.
7. Client pulls remote changes from `GET /sync/pull?since=:cursor`, applies them locally, and updates `syncCursors`.

Deletes are tombstones, not immediate hard deletes, until the server confirms and retention windows pass.

## 3. Sync State Machine

### Entity State

```text
SYNCED -> DIRTY -> SYNCED
SYNCED -> DELETED -> tombstone confirmed -> pruned
DIRTY  -> CONFLICTED -> DIRTY or SYNCED
DIRTY  -> FAILED retry remains DIRTY
```

### Queue Item State

```text
QUEUED
  -> IN_FLIGHT
  -> APPLIED
  -> CONFLICTED
  -> FAILED -> QUEUED after backoff
```

### Sync Session State

```text
IDLE -> PUSHING -> PULLING -> APPLYING -> IDLE
IDLE -> OFFLINE
PUSHING/PULLING/APPLYING -> DEGRADED on partial failure
DEGRADED -> IDLE after retry success
```

One device may have many local accounts, but each account/device pair keeps its own cursor and queue identity.

## 4. Conflict Strategies

### Last-write

- Default for low-risk scalar settings and layout coordinates.
- Server compares `updatedAt`, server version, and trusted receipt time.
- Useful for theme, accent color, note position, and card ordering.

### Merge

- Default for additive structures.
- Tags merge by normalized tag id/name.
- Website metadata merges by field ownership: user-edited title/note wins over fetched metadata, newer favicon/thumbnail may replace generated values.
- Sticky-note checklist items can merge by item id when content shape supports it.
- Category order uses server-normalized order indexes after applying all accepted moves.

### Manual

- Required for destructive changes and ambiguous edits:
  - same note body edited on two devices,
  - category deleted on one device and edited on another,
  - same website note edited differently,
  - shared-board permission changes.
- Server returns both snapshots. Client stores a `conflicts` record and marks entity `CONFLICTED`.
- Conflict UI lets user choose local, remote, field-level merge, or rollback.

### Rollback

- Rollback restores an `entityVersions.snapshot` into the primary table.
- Rollback creates a new queue item rather than mutating history.
- Server-side rollback uses `EntityVersion` to create a new authoritative version.

## 5. Failure Recovery

- Idempotency keys make offline retries safe.
- Queue retries use exponential backoff with jitter and `nextAttemptAt`.
- App startup scans `IN_FLIGHT` items from previous crashes and returns them to `QUEUED`.
- Pull uses durable cursors; cursor advances only after local transaction commit.
- Partial batch failures only retry failed items.
- Deleted entities remain as tombstones until all active devices have had a chance to pull.
- Server rejects stale base versions with conflict payloads instead of silently overwriting.
- If local IndexedDB is corrupted, user can reset local state and rehydrate from server after authentication.

## 6. Security Risks

- Never trust local versions, ownership, visibility, or user ids; server revalidates every operation.
- Sync payloads can contain stored-XSS content in notes, tags, titles, and metadata; sanitize on input and output.
- Metadata fetch must block SSRF targets such as localhost, private IP ranges, and cloud metadata endpoints.
- Device ids are identifiers, not secrets; authenticate every sync request with a valid session.
- Queue payloads may contain private content, so avoid logging raw payloads.
- Shared-board sync paths must filter private notes/cards and enforce permission on every mutation.
- Refresh tokens must not be stored in IndexedDB; keep them in secure HTTP-only cookies or a hardened native/extension flow.

## 7. Performance Optimization

- Batch push and pull operations by entity type and size limit.
- Use compound Dexie indexes for hot paths: `[status+nextAttemptAt]`, `[entityType+entityId]`, `[userId+updatedAt]`, and category ordering.
- Apply server pull results in a single IndexedDB transaction per batch.
- Debounce noisy writes such as drag movement and note resizing; enqueue the final state.
- Keep large media in object storage/cache, not sync payloads.
- Compact old `entityVersions` locally while keeping recent rollback windows.
- Prune applied queue rows after confirmed sync and retention.
- Use service worker background sync where available, with foreground fallback for browsers that do not support it.
- Prefer PostgreSQL plus Prisma, browser Background Sync, and self-hostable workers/cron over paid sync vendors for the MVP.
