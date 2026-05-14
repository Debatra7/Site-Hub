# Implementation Modules

This module plan is derived from the SRS and the current technical blueprint: Next.js, TypeScript, Tailwind CSS, Zustand, Dexie/IndexedDB, Express.js, Prisma, PostgreSQL, OAuth, service workers, and a Manifest V3 browser extension.

Priority scale:

- P0: MVP foundation
- P1: MVP user value
- P2: post-MVP or operational expansion

## 1. Authentication System

### Core Responsibilities

- OAuth login with Google, GitHub, and extensible providers.
- Session creation, refresh, expiration, and logout from all devices.
- Fast account switching with separate local profiles.
- User profile, preferences bootstrap, and account deletion entry points.

### Required Frontend Systems

- Login and OAuth callback screens.
- Auth state provider integrated with Zustand.
- Session-aware route guards.
- Account switcher and local profile selector.
- Secure local session metadata storage with per-account IndexedDB namespaces or scoped records.

### Required Backend Systems

- OAuth provider strategy layer.
- Session and refresh-token service.
- User provisioning service.
- Device/session registry.
- Account deletion and data export hooks.

### Database Tables

- `User`
- `Session`
- `OAuthAccount`
- `RefreshToken`
- `AuditLog`

### APIs

- `GET /auth/:provider`
- `GET /auth/:provider/callback`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /auth/me`
- `GET /users/me/sessions`
- `DELETE /users/me`

### Security Considerations

- Use secure, HTTP-only, same-site cookies for server sessions.
- Encrypt OAuth and refresh tokens at rest.
- Rotate refresh tokens and revoke reused tokens.
- Enforce CSRF protection for cookie-authenticated writes.
- Rate-limit login, refresh, and callback endpoints.

### Dependencies

- Security Layer
- Local-first Sync Engine
- Personalization System

### MVP Priority

P0

## 2. Local-first Sync Engine

### Core Responsibilities

- Persist all user changes locally before cloud sync.
- Queue offline mutations and replay them when online.
- Track entity versions, timestamps, tombstones, and sync status.
- Detect conflicts and support merge, overwrite, skip, and manual resolution.
- Keep multiple devices eventually consistent.

### Required Frontend Systems

- Dexie database schema and migrations.
- Sync queue store.
- Background sync worker/service worker integration.
- Conflict resolution UI.
- Offline and sync health indicators.
- Entity repositories for categories, websites, notes, tags, settings, and shares.

### Required Backend Systems

- Sync ingestion service.
- Change feed/pull service.
- Conflict detection service.
- Entity versioning and tombstone handling.
- Idempotency key handling for retried offline requests.

### Database Tables

- `SyncLog`
- `SyncOperation`
- `EntityVersion`
- `Conflict`
- `User`
- `Category`
- `Website`
- `StickyNote`
- `Tag`
- `SharedBoard`
- `UserPreference`

### APIs

- `POST /sync/push`
- `GET /sync/pull?since=:cursor`
- `POST /sync/conflicts/:id/resolve`
- `GET /sync/status`
- `POST /sync/devices/:deviceId/register`

### Security Considerations

- Scope all sync records by authenticated user.
- Validate entity ownership on every mutation.
- Require idempotency keys for queued writes.
- Reject stale or malformed client versions.
- Avoid leaking private categories through shared-board sync paths.

### Dependencies

- Authentication System
- Security Layer
- Category Management
- Website Card System
- Sticky Notes System
- Tagging Engine
- Personalization System

### MVP Priority

P0

## 3. Category Management

### Core Responsibilities

- Create, rename, reorder, customize, export, and delete categories.
- Manage category icons, wallpapers, and privacy state.
- Support drag-and-drop ordering.
- Provide category-scoped views for websites and notes.

### Required Frontend Systems

- Sidebar/category navigation.
- Category CRUD dialogs.
- Drag-and-drop reorder using dnd-kit.
- Category grid/detail view.
- Category privacy controls.
- Category wallpaper/icon picker.

### Required Backend Systems

- Category CRUD service.
- Order-index normalization.
- Privacy enforcement service.
- Category export payload builder.
- Sync-aware category mutation handlers.

### Database Tables

- `Category`
- `Website`
- `StickyNote`
- `Tag`
- `SharedBoard`
- `SyncOperation`

### APIs

- `GET /categories`
- `POST /categories`
- `GET /categories/:id`
- `PATCH /categories/:id`
- `DELETE /categories/:id`
- `POST /categories/reorder`
- `GET /categories/:id/export`

### Security Considerations

- Enforce user ownership on all category routes.
- Prevent deletion of shared/private data by non-owners.
- Validate wallpaper and icon payloads.
- Cascade or soft-delete related entities intentionally.

### Dependencies

- Authentication System
- Local-first Sync Engine
- Personalization System
- Shared Boards
- Security Layer

### MVP Priority

P0

## 4. Website Card System

### Core Responsibilities

- Save and manage URL cards inside categories.
- Fetch and store metadata, title, description, favicon, and thumbnails.
- Support pinning, colors, notes, search indexing, bulk move/delete, and drag-and-drop.
- Allow manual metadata edits.

### Required Frontend Systems

- Website card component.
- Add/edit website modal.
- Metadata preview and fallback UI.
- Card grid with drag-and-drop ordering.
- Bulk selection toolbar.
- Search and filter integration.

### Required Backend Systems

- Website CRUD service.
- Metadata fetcher with timeout and safe URL validation.
- Favicon/thumbnail resolver.
- Bulk action service.
- Search indexing pipeline or PostgreSQL search view.

### Database Tables

- `Website`
- `Category`
- `Tag`
- `WebsiteTag`
- `SyncOperation`

### APIs

- `GET /websites?categoryId=:categoryId`
- `POST /websites`
- `GET /websites/:id`
- `PATCH /websites/:id`
- `DELETE /websites/:id`
- `POST /websites/reorder`
- `POST /websites/bulk`
- `POST /metadata/fetch`

### Security Considerations

- Validate and normalize URLs.
- Block SSRF-prone metadata fetch targets, including localhost and private IP ranges.
- Sanitize titles, descriptions, and notes before rendering.
- Enforce category ownership before card mutations.

### Dependencies

- Category Management
- Tagging Engine
- Local-first Sync Engine
- Security Layer

### MVP Priority

P0

## 5. Sticky Notes System

### Core Responsibilities

- Create dashboard-level and category-level sticky notes.
- Support text, checklist, media, links, and reminders.
- Manage note color, size, position, tags, search, and filters.
- Persist note layout locally and sync changes.

### Required Frontend Systems

- Sticky note canvas/board.
- Note editor for text, checklist, media, and reminders.
- Position and resize controls.
- Reminder UI.
- Note search/filter integration.

### Required Backend Systems

- Sticky note CRUD service.
- Reminder scheduling service.
- Media attachment service.
- Sync-aware layout persistence.

### Database Tables

- `StickyNote`
- `Tag`
- `StickyNoteTag`
- `MediaAsset`
- `Reminder`
- `SyncOperation`

### APIs

- `GET /notes?categoryId=:categoryId`
- `POST /notes`
- `GET /notes/:id`
- `PATCH /notes/:id`
- `DELETE /notes/:id`
- `POST /notes/:id/reminders`
- `POST /media/uploads`

### Security Considerations

- Sanitize rich content and embedded links.
- Validate media MIME type, size, and storage location.
- Keep private/category-scoped notes hidden from shared-board viewers unless explicitly included.
- Restrict reminder operations to note owners.

### Dependencies

- Category Management
- Tagging Engine
- Local-first Sync Engine
- Personalization System
- Security Layer

### MVP Priority

P1

## 6. Tagging Engine

### Core Responsibilities

- Provide unrestricted user-defined tags.
- Assign tags to websites, sticky notes, categories, and shared-board-visible items.
- Support autocomplete, merge, rename, delete, color labels, filtering, grouping, and search.

### Required Frontend Systems

- Tag input with autocomplete.
- Tag manager screen.
- Tag chips and color labels.
- Search/filter controls.
- Merge and rename dialogs.

### Required Backend Systems

- Tag CRUD service.
- Tag assignment service.
- Merge/delete propagation.
- Search/filter query helpers.

### Database Tables

- `Tag`
- `WebsiteTag`
- `StickyNoteTag`
- `CategoryTag`
- `SyncOperation`

### APIs

- `GET /tags`
- `POST /tags`
- `PATCH /tags/:id`
- `DELETE /tags/:id`
- `POST /tags/:id/merge`
- `POST /tags/assign`
- `POST /tags/unassign`
- `GET /search?tag=:tag`

### Security Considerations

- Scope tags to the owning user.
- Validate tag length, color values, and duplicate names.
- Prevent tag enumeration across users.
- Sanitize tag names in rendered chips and shared boards.

### Dependencies

- Authentication System
- Local-first Sync Engine
- Website Card System
- Sticky Notes System
- Category Management

### MVP Priority

P1

## 7. Personalization System

### Core Responsibilities

- Manage theme mode, accent color, layout preferences, global wallpaper, and category wallpapers.
- Support user-uploaded images, GIFs, and looping video backgrounds.
- Apply personalization consistently across devices.

### Required Frontend Systems

- Theme provider and CSS variable layer.
- Settings/preferences panel.
- Wallpaper picker and media preview.
- Local fallback when media is unavailable offline.
- Category-specific personalization controls.

### Required Backend Systems

- Preferences service.
- Media upload/storage service.
- Active wallpaper/media enforcement.
- Sync-aware settings persistence.

### Database Tables

- `UserPreference`
- `MediaAsset`
- `Category`
- `User`
- `SyncOperation`

### APIs

- `GET /preferences`
- `PATCH /preferences`
- `POST /media/uploads`
- `DELETE /media/:id`
- `PATCH /categories/:id/personalization`

### Security Considerations

- Validate upload MIME type, size, dimensions, and duration.
- Prevent executable or scriptable uploads.
- Keep media references scoped to owner.
- Use signed or access-controlled media URLs for private content.

### Dependencies

- Authentication System
- Local-first Sync Engine
- Category Management
- Security Layer

### MVP Priority

P1

## 8. Import/Export

### Core Responsibilities

- Export full account data, individual categories, sticky notes, settings, and user data archives.
- Import JSON payloads.
- Detect duplicates and resolve conflicts through merge, replace, skip, or manual selection.
- Preserve portability and self-hosting migration paths.

### Required Frontend Systems

- Import wizard.
- Export/download controls.
- Conflict resolver UI.
- Import progress and validation result screens.
- Per-category export action.

### Required Backend Systems

- Export assembler.
- Import parser and validator.
- Duplicate detection service.
- Conflict resolution service.
- Data archive generator.

### Database Tables

- `ImportJob`
- `ExportJob`
- `Category`
- `Website`
- `StickyNote`
- `Tag`
- `UserPreference`
- `SharedBoard`
- `AuditLog`

### APIs

- `GET /export/account`
- `GET /export/categories/:id`
- `POST /import`
- `GET /import/:jobId`
- `POST /import/:jobId/resolve`
- `GET /users/me/archive`

### Security Considerations

- Authenticate every export request.
- Rate-limit exports and imports.
- Validate imported JSON with schema checks.
- Strip unsafe HTML/scripts from imported content.
- Ensure exported shared data does not include unauthorized collaborator data.

### Dependencies

- Authentication System
- Local-first Sync Engine
- Category Management
- Website Card System
- Sticky Notes System
- Tagging Engine
- Personalization System
- Security Layer

### MVP Priority

P1

## 9. Shared Boards

### Core Responsibilities

- Share categories/boards through generated links.
- Support view-only and collaborative edit permissions.
- Revoke shares and expire links.
- Expose shared-board views without leaking private user data.

### Required Frontend Systems

- Share settings dialog.
- Public/shared board view.
- Permission selector.
- Collaborator editing indicators.
- Revocation and link-copy controls.

### Required Backend Systems

- Share-link generation service.
- Permission enforcement service.
- Shared-board read/write gateway.
- Share revocation and expiration worker.
- Collaborative edit sync integration.

### Database Tables

- `SharedBoard`
- `SharedBoardMember`
- `Category`
- `Website`
- `StickyNote`
- `Tag`
- `AuditLog`

### APIs

- `POST /shares`
- `GET /shares/:token`
- `PATCH /shares/:id`
- `DELETE /shares/:id`
- `POST /shares/:id/members`
- `DELETE /shares/:id/members/:memberId`

### Security Considerations

- Store share tokens hashed.
- Enforce permission type on every shared-board action.
- Prevent private categories from being exposed accidentally.
- Rate-limit public token lookup.
- Log share creation, permission changes, and revocation.

### Dependencies

- Authentication System
- Category Management
- Website Card System
- Sticky Notes System
- Tagging Engine
- Local-first Sync Engine
- Security Layer

### MVP Priority

P2

## 10. Browser Extension

### Core Responsibilities

- Save the current website from the browser.
- Select destination category.
- Fetch metadata and optionally add a quick note/tags.
- Sync saved websites with the web app.

### Required Frontend Systems

- Manifest V3 extension popup.
- Destination category selector.
- Quick-save form.
- Extension auth bridge with the web app.
- Background service worker for context menu and active-tab actions.

### Required Backend Systems

- Extension-safe auth/session endpoint.
- Quick-save API.
- Metadata fetch service.
- Extension adoption telemetry.

### Database Tables

- `Website`
- `Category`
- `Tag`
- `ExtensionDevice`
- `AnalyticsEvent`
- `SyncOperation`

### APIs

- `GET /extension/session`
- `GET /extension/categories`
- `POST /extension/save`
- `POST /metadata/fetch`
- `POST /analytics/events`

### Security Considerations

- Minimize extension permissions.
- Validate active-tab URL before saving.
- Do not expose refresh tokens to extension storage.
- Use short-lived extension tokens or web-app mediated auth.
- Rate-limit quick-save and metadata endpoints.

### Dependencies

- Authentication System
- Website Card System
- Category Management
- Tagging Engine
- Local-first Sync Engine
- Security Layer

### MVP Priority

P2

## 11. Admin Analytics Dashboard

### Core Responsibilities

- Track product, technical, sync, security, and operational metrics.
- Show DAU, WAU, MAU, retention, sessions, sync reliability, feature adoption, storage, and error trends.
- Provide filters, charts, cohort views, exportable reports, and audit logs.
- Monitor abuse and security incidents.

### Required Frontend Systems

- Admin-only dashboard shell.
- Metric cards, charts, tables, and date filters.
- Cohort and feature adoption views.
- Security event and audit log screens.
- CSV/JSON report export controls.

### Required Backend Systems

- Analytics event ingestion service.
- Aggregation jobs or PostgreSQL materialized views.
- Admin authorization middleware.
- Report export service.
- Alerting/threshold service.

### Database Tables

- `AnalyticsEvent`
- `AnalyticsAggregate`
- `AuditLog`
- `SecurityEvent`
- `Session`
- `SyncLog`
- `ImportJob`
- `ExportJob`
- `ExtensionDevice`

### APIs

- `GET /admin/analytics/overview`
- `GET /admin/analytics/usage`
- `GET /admin/analytics/sync`
- `GET /admin/analytics/security`
- `GET /admin/audit-logs`
- `GET /admin/reports/export`

### Security Considerations

- Require admin role and step-up authentication for sensitive views.
- Aggregate or anonymize personal data wherever possible.
- Prevent admin endpoints from exposing raw OAuth tokens, private note content, or private URLs.
- Audit all admin access.
- Rate-limit analytics export endpoints.

### Dependencies

- Authentication System
- Security Layer
- Local-first Sync Engine
- Import/Export
- Browser Extension
- Shared Boards

### MVP Priority

P2

## 12. Security Layer

### Core Responsibilities

- Provide cross-cutting protection for auth, sync, data access, uploads, sharing, imports, and admin tools.
- Centralize validation, authorization, rate limiting, logging, encryption, and secure headers.
- Support privacy rights: export, deletion, session management, and sharing control.

### Required Frontend Systems

- Safe rendering utilities for user-generated content.
- Auth-aware fetch client with CSRF handling.
- Permission-aware UI guards.
- Session/device management screens.
- Security and privacy settings.

### Required Backend Systems

- Authentication and authorization middleware.
- Role-based access control.
- Zod validation schemas.
- CSRF, CORS, rate limiting, and secure headers.
- Token/media encryption utilities.
- Audit and security event logging.
- SSRF-safe metadata fetch gateway.

### Database Tables

- `User`
- `Session`
- `Role`
- `AuditLog`
- `SecurityEvent`
- `RateLimitEvent`
- `RefreshToken`
- `SharedBoard`

### APIs

- `GET /security/sessions`
- `DELETE /security/sessions/:id`
- `GET /security/audit-log`
- `POST /security/report`
- `GET /security/privacy`
- Shared middleware across all protected APIs

### Security Considerations

- HTTPS-only production deployment.
- Secure cookies with appropriate same-site policy.
- Input validation for every request body, query, and route parameter.
- Ownership checks on every user-owned entity.
- XSS, CSRF, SSRF, SQL injection, and upload abuse defenses.
- Principle of least privilege for admin and extension flows.

### Dependencies

- None as a product module; all other modules depend on it.

### MVP Priority

P0

