# REST API Architecture

Stack: Express.js, Prisma, PostgreSQL, Zod, JWT/session middleware, `express-rate-limit`.

Base URL: `/api/v1`

Response envelope:

```json
{ "data": {}, "page": { "nextCursor": null, "hasMore": false } }
```

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {},
    "requestId": "..."
  }
}
```

## Shared Architecture

- Validation: every body/query/params payload uses Zod schemas before controller logic.
- Auth middleware:
  - `optionalAuth` for public shared-board reads and anonymous-capable analytics.
  - `requireAuth` for user-owned resources.
  - `requireAdmin` for admin analytics.
- Pagination: cursor-based pagination with `limit` capped at 100 and `cursor` as an opaque server token.
- Versioning: all endpoints are mounted under `/api/v1`; breaking API changes create `/api/v2`.
- Ownership: every Prisma query for user-owned resources scopes by `req.auth.userId`.
- Idempotency: sync push uses `idempotencyKey`; import/export jobs should also accept an `Idempotency-Key` header when implemented.
- Standard errors: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 CONFLICT`, `410 GONE`, `422 UNPROCESSABLE_ENTITY`, `429 RATE_LIMITED`, `500 INTERNAL_SERVER_ERROR`.

## Rate Limits

- Standard API: 600 requests / 15 minutes.
- Auth: 40 requests / 15 minutes.
- Writes: 120 requests / minute.
- Sync: 240 requests / minute.
- Analytics ingest: 300 requests / minute.
- Import/export: 10 requests / hour.

## Auth

| Method | Endpoint | Auth | Validation | Rate |
| --- | --- | --- | --- | --- |
| GET | `/auth/:provider` | public | provider allow-list | auth |
| GET | `/auth/:provider/callback` | public | OAuth callback params | auth |
| POST | `/auth/refresh` | refresh token/cookie | optional refresh token body | auth |
| POST | `/auth/logout` | user | optional session id | standard |
| POST | `/auth/logout-all` | user | none | auth |
| GET | `/auth/me` | user | none | standard |
| GET | `/auth/sessions` | user | pagination later | standard |
| DELETE | `/auth/sessions/:id` | user | UUID param | write |

Implementation notes:

- Store session and refresh tokens hashed.
- Rotate refresh tokens on every refresh.
- Support multi-account OAuth with `OAuthAccount`.
- Return active user, linked providers, device id, and permissions from `/auth/me`.

## Categories

| Method | Endpoint | Auth | Validation | Pagination |
| --- | --- | --- | --- | --- |
| GET | `/categories` | user | `visibility`, `updatedSince`, `limit`, `cursor` | cursor |
| POST | `/categories` | user | name, icon, wallpaper, visibility, order | no |
| GET | `/categories/:id` | user/share permission | UUID param | no |
| PATCH | `/categories/:id` | owner/editor | partial category body | no |
| DELETE | `/categories/:id` | owner | UUID param | no |
| POST | `/categories/reorder` | owner | array of id/order pairs | no |
| GET | `/categories/:id/export` | owner | UUID param | async export recommended |

Error handling:

- `409 CONFLICT` for duplicate category names or stale versions.
- `403 FORBIDDEN` for shared-board editors attempting owner-only operations.

## Websites

| Method | Endpoint | Auth | Validation | Pagination |
| --- | --- | --- | --- | --- |
| GET | `/websites` | user | category, tag, search, cursor | cursor |
| POST | `/websites` | user/editor | URL, category, metadata, tags | no |
| GET | `/websites/:id` | user/share permission | UUID param | no |
| PATCH | `/websites/:id` | owner/editor | partial website body | no |
| DELETE | `/websites/:id` | owner/editor | UUID param | no |
| POST | `/websites/bulk` | owner/editor | action, ids, optional category | no |
| POST | `/websites/metadata/fetch` | user | URL | no |

Security:

- Normalize and validate URLs.
- Metadata fetch must block SSRF targets and time out aggressively.
- Sanitize title, description, and notes before rendering.

## Sticky Notes

| Method | Endpoint | Auth | Validation | Pagination |
| --- | --- | --- | --- | --- |
| GET | `/sticky-notes` | user | category, tag, cursor | cursor |
| POST | `/sticky-notes` | user/editor | note type, content, position, visibility | no |
| GET | `/sticky-notes/:id` | user/share permission | UUID param | no |
| PATCH | `/sticky-notes/:id` | owner/editor | partial note body | no |
| DELETE | `/sticky-notes/:id` | owner/editor | UUID param | no |
| POST | `/sticky-notes/:id/reminders` | owner | reminder payload | no |

Validation:

- `content` is JSON but must be normalized by note type in service logic.
- Rich text/media/link content should be sanitized before persistence.

## Tags

| Method | Endpoint | Auth | Validation | Pagination |
| --- | --- | --- | --- | --- |
| GET | `/tags` | user | search, cursor | cursor |
| POST | `/tags` | user | name, color | no |
| PATCH | `/tags/:id` | owner | name/color | no |
| DELETE | `/tags/:id` | owner | UUID param | no |
| POST | `/tags/:id/merge` | owner | target tag id | no |
| POST | `/tags/assign` | owner/editor | entity type/id, tag id | no |
| POST | `/tags/unassign` | owner/editor | entity type/id, tag id | no |

Error handling:

- `409 CONFLICT` for duplicate normalized tag names.
- `404 NOT_FOUND` when assignment target is not owned or visible to the caller.

## Sync

| Method | Endpoint | Auth | Validation | Pagination |
| --- | --- | --- | --- | --- |
| POST | `/sync/push` | user | device id, operations batch | no |
| GET | `/sync/pull` | user | since cursor, device id, limit | cursor |
| GET | `/sync/status` | user | none | no |
| POST | `/sync/devices/register` | user | client/device metadata | no |
| POST | `/sync/conflicts/:id/resolve` | user | strategy, resolved payload | no |

Behavior:

- `POST /sync/push` is idempotent by `(userId, idempotencyKey)`.
- Server compares `baseVersion` to current entity version.
- Accepted writes append `SyncOperation` and `EntityVersion`.
- Conflicts return `409 CONFLICT` with server/client snapshots and create `ConflictLog`.
- Pull responses include opaque next cursor and tombstones.

## Sharing

| Method | Endpoint | Auth | Validation | Pagination |
| --- | --- | --- | --- | --- |
| GET | `/sharing/public/:token` | optional | share token | no |
| POST | `/sharing` | owner | category, permission, expiry | no |
| GET | `/sharing` | user | cursor later | cursor |
| GET | `/sharing/:id` | owner/member | UUID param | no |
| PATCH | `/sharing/:id` | owner | permission, expiry, status | no |
| DELETE | `/sharing/:id` | owner | UUID param | no |
| POST | `/sharing/:id/members` | owner | user, permission | no |
| DELETE | `/sharing/:id/members/:memberId` | owner | UUID params | no |

Security:

- Store only hashed share tokens.
- Rate-limit token lookups.
- Filter private entities from public/shared responses.

## Analytics

| Method | Endpoint | Auth | Validation | Pagination |
| --- | --- | --- | --- | --- |
| POST | `/analytics/events` | user | event source/name/properties | no |
| GET | `/analytics/admin/overview` | admin | date filters | no |
| GET | `/analytics/admin/usage` | admin | date/source/event filters | cursor |
| GET | `/analytics/admin/sync` | admin | date filters | cursor |
| GET | `/analytics/admin/security` | admin | date filters | cursor |
| GET | `/analytics/admin/reports/export` | admin | date filters | async export |

Privacy:

- Prefer aggregate metrics.
- Avoid storing raw private note content, OAuth tokens, or full sensitive URLs in analytics properties.

## Import/Export

| Method | Endpoint | Auth | Validation | Pagination |
| --- | --- | --- | --- | --- |
| POST | `/import` | user | source, conflict strategy, JSON payload | no |
| GET | `/import/:id` | owner | UUID param | no |
| POST | `/import/:id/resolve` | owner | manual conflict choices | no |
| GET | `/export` | user | scope, optional category id | no |
| GET | `/export/:id` | owner | UUID param | no |
| GET | `/archive` | user | none | no |

Behavior:

- Long-running import/export should create jobs and return `202 Accepted`.
- Export links should expire and require authentication.
- Imports validate payload shape before writing anything.

## User Settings

| Method | Endpoint | Auth | Validation | Pagination |
| --- | --- | --- | --- | --- |
| GET | `/settings` | user | none | no |
| PATCH | `/settings` | user | theme, accent, layout, dashboard config | no |
| GET | `/settings/privacy` | user | none | no |
| PATCH | `/settings/privacy` | user | privacy defaults | no |

Versioning:

- Settings updates should include the current preference version once optimistic concurrency is wired.
- Syncable settings produce `EntityVersion` rows and flow through `/sync/pull`.
