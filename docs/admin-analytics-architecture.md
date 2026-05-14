# Admin Analytics Architecture

Preferred stack: self-hosted PostHog OSS for product analytics capture and exploration, plus PostgreSQL views/materialized views for first-party admin dashboards, operational analytics, and compliance-friendly reporting.

## Event Schema

Canonical event table: `AnalyticsEvent`.

Fields:

- `id`: event id.
- `userId`: authenticated user id, nullable for anonymous pre-login events.
- `anonymousId`: anonymous browser/device id.
- `sessionId`: current session id when available.
- `source`: `WEB_APP`, `PWA`, `EXTENSION`, `SERVER`, or `ADMIN`.
- `eventName`: stable snake_case event name.
- `properties`: JSON object with safe metadata.
- `occurredAt`: client/server event time.
- `createdAt`: ingestion time.

Recommended event names:

- Activation: `signup_started`, `signup_completed`, `oauth_login_completed`, `dashboard_viewed`.
- Engagement: `app_opened`, `category_viewed`, `website_opened`, `search_performed`.
- Feature adoption: `category_created`, `website_saved`, `sticky_note_created`, `tag_created`, `theme_changed`, `board_shared`, `import_completed`, `export_completed`, `extension_save_completed`.
- Sync: `sync_started`, `sync_completed`, `sync_failed`, `sync_conflict_detected`, `sync_conflict_resolved`, `offline_write_queued`.
- Errors: `error_occurred`, `api_request_failed`, `metadata_fetch_failed`, `extension_error`.
- Abuse/security: prefer `SecurityEvent` for authoritative security records; mirror aggregate-safe analytics events like `rate_limit_triggered`, `share_token_probe_detected`, `export_abuse_detected`.

Safe common properties:

- `module`: feature module, such as `sync`, `websites`, `sharing`.
- `entityType`: coarse entity type.
- `count`: numeric aggregate.
- `durationMs`: operation duration.
- `result`: `success`, `failure`, `conflict`, or `cancelled`.
- `errorCode`: normalized application error code.
- `deviceType`, `browser`, `platform`: coarse device metadata.

Never store OAuth tokens, refresh tokens, private note bodies, raw import payloads, full private URLs, or share tokens in analytics properties.

## Tracking Strategy

- Client tracking:
  - Track dashboard views, feature actions, offline queue events, theme changes, and extension adoption events.
  - Queue analytics events locally when offline and flush through `/api/v1/analytics/events`.
  - Use PostHog OSS SDK for product exploration when consent/settings allow it.
- Server tracking:
  - Emit authoritative events for auth, sync results, import/export jobs, shared-board creation, API errors, and security thresholds.
  - Use `SecurityEvent` for abuse and incident workflows, then expose aggregates in admin modules.
- PostgreSQL views:
  - Keep high-volume raw events append-only.
  - Use views in `server/prisma/views/admin_analytics_views.sql` for DAU/WAU/MAU, feature adoption, sync health, error rates, abuse, cohorts, and activation funnel.
  - Convert heavy views to materialized views when event volume grows.
- PostHog OSS:
  - Use for ad hoc funnels, cohorts, retention charts, and feature adoption exploration.
  - Keep PostgreSQL as the admin dashboard source of truth for operational and compliance reporting.

## Privacy Controls

- Make analytics collection visible in settings.
- Allow opt-out for non-essential product analytics.
- Keep security, audit, and abuse monitoring as legitimate-interest operational telemetry.
- Hash or avoid IP addresses in product analytics; keep raw IP only in security logs with retention limits.
- Minimize properties and avoid user-generated content.
- Segment admin dashboard access with `ADMIN` role and audit every admin analytics export.
- Use aggregation thresholds where possible so tiny cohorts do not expose individual behavior.
- Support account deletion by deleting or anonymizing user-linked analytics according to retention policy.

## Dashboard Modules

### Executive Overview

- DAU, WAU, MAU.
- New signups.
- Activation rate.
- Retention trend.
- Top adopted features.

### Retention

- Signup cohorts by month/week.
- Day 1, day 7, day 30 retention.
- Returning-user trend.
- Offline-to-online recovery behavior.

### Feature Adoption

- Categories created per active user.
- Websites saved per active user.
- Sticky note creation and completion.
- Tag usage.
- Theme/wallpaper personalization.
- Shared boards.
- Extension save flow.
- Import/export usage.

### Sync Health

- Sync success rate.
- Sync failure count and failure reason.
- Conflict frequency.
- Queue age and retry count.
- Device consistency lag.
- Offline write volume.

### Reliability and Error Rates

- API errors by module.
- Client errors by browser/platform.
- Metadata fetch failures.
- Import/export failures.
- Extension errors.

### Abuse Monitoring

- Failed login attempts.
- Rate-limit violations.
- Share-token probing.
- Export abuse.
- Suspicious sync tampering.
- Admin access anomalies.

### Cohort Analysis

- Signup cohort retention.
- Feature-adoption cohorts.
- Extension-user cohort versus web-only cohort.
- Shared-board users versus private-only users.

### Funnel Analysis

- Activation funnel:
  1. signup completed
  2. category created
  3. website saved
  4. sync completed
  5. return visit
- Sharing funnel:
  1. share dialog opened
  2. board shared
  3. recipient opened
  4. collaborator accepted
- Extension funnel:
  1. extension installed
  2. extension authenticated
  3. first quick save
  4. repeated weekly save
