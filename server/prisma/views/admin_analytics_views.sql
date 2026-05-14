-- Admin analytics read models for PostgreSQL.
-- Apply these through a manual migration once the base Prisma tables exist.

CREATE OR REPLACE VIEW analytics_daily_active_users AS
SELECT
  date_trunc('day', "occurredAt")::date AS day,
  count(DISTINCT "userId") FILTER (WHERE "userId" IS NOT NULL) AS dau,
  count(DISTINCT "anonymousId") FILTER (WHERE "anonymousId" IS NOT NULL) AS anonymous_active
FROM "AnalyticsEvent"
WHERE "eventName" IN ('app_opened', 'dashboard_viewed', 'category_viewed', 'website_opened', 'sync_completed')
GROUP BY 1;

CREATE OR REPLACE VIEW analytics_weekly_active_users AS
SELECT
  date_trunc('week', "occurredAt")::date AS week,
  count(DISTINCT "userId") FILTER (WHERE "userId" IS NOT NULL) AS wau
FROM "AnalyticsEvent"
WHERE "eventName" IN ('app_opened', 'dashboard_viewed', 'category_viewed', 'website_opened', 'sync_completed')
GROUP BY 1;

CREATE OR REPLACE VIEW analytics_monthly_active_users AS
SELECT
  date_trunc('month', "occurredAt")::date AS month,
  count(DISTINCT "userId") FILTER (WHERE "userId" IS NOT NULL) AS mau
FROM "AnalyticsEvent"
WHERE "eventName" IN ('app_opened', 'dashboard_viewed', 'category_viewed', 'website_opened', 'sync_completed')
GROUP BY 1;

CREATE OR REPLACE VIEW analytics_feature_adoption AS
SELECT
  "eventName",
  count(*) AS event_count,
  count(DISTINCT "userId") FILTER (WHERE "userId" IS NOT NULL) AS unique_users,
  min("occurredAt") AS first_seen_at,
  max("occurredAt") AS last_seen_at
FROM "AnalyticsEvent"
WHERE "eventName" IN (
  'category_created',
  'website_saved',
  'sticky_note_created',
  'tag_created',
  'board_shared',
  'import_completed',
  'export_completed',
  'extension_save_completed',
  'theme_changed'
)
GROUP BY 1;

CREATE OR REPLACE VIEW analytics_sync_health_daily AS
SELECT
  date_trunc('day', "occurredAt")::date AS day,
  count(*) FILTER (WHERE "eventName" = 'sync_completed') AS sync_success_count,
  count(*) FILTER (WHERE "eventName" = 'sync_failed') AS sync_failure_count,
  count(*) FILTER (WHERE "eventName" = 'sync_conflict_detected') AS sync_conflict_count,
  round(
    100.0 * count(*) FILTER (WHERE "eventName" = 'sync_completed')
    / NULLIF(count(*) FILTER (WHERE "eventName" IN ('sync_completed', 'sync_failed')), 0),
    2
  ) AS sync_success_rate
FROM "AnalyticsEvent"
WHERE "eventName" IN ('sync_completed', 'sync_failed', 'sync_conflict_detected')
GROUP BY 1;

CREATE OR REPLACE VIEW analytics_error_rates_daily AS
SELECT
  date_trunc('day', "occurredAt")::date AS day,
  COALESCE("properties"->>'module', 'unknown') AS module,
  count(*) AS error_count,
  count(DISTINCT "userId") FILTER (WHERE "userId" IS NOT NULL) AS affected_users
FROM "AnalyticsEvent"
WHERE "eventName" = 'error_occurred'
GROUP BY 1, 2;

CREATE OR REPLACE VIEW analytics_abuse_daily AS
SELECT
  date_trunc('day', "createdAt")::date AS day,
  "eventType",
  "severity",
  count(*) AS event_count,
  count(DISTINCT "userId") FILTER (WHERE "userId" IS NOT NULL) AS affected_users
FROM "SecurityEvent"
GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW analytics_signup_cohorts AS
WITH cohorts AS (
  SELECT
    id AS user_id,
    date_trunc('month', "createdAt")::date AS cohort_month
  FROM "User"
),
activity AS (
  SELECT DISTINCT
    "userId" AS user_id,
    date_trunc('month', "occurredAt")::date AS activity_month
  FROM "AnalyticsEvent"
  WHERE "userId" IS NOT NULL
)
SELECT
  c.cohort_month,
  a.activity_month,
  (
    extract(year FROM age(a.activity_month, c.cohort_month)) * 12
    + extract(month FROM age(a.activity_month, c.cohort_month))
  )::int AS months_since_signup,
  count(DISTINCT a.user_id) AS retained_users
FROM cohorts c
JOIN activity a ON a.user_id = c.user_id
WHERE a.activity_month >= c.cohort_month
GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW analytics_activation_funnel_daily AS
SELECT
  date_trunc('day', "occurredAt")::date AS day,
  count(DISTINCT "userId") FILTER (WHERE "eventName" = 'signup_completed') AS signed_up,
  count(DISTINCT "userId") FILTER (WHERE "eventName" = 'category_created') AS created_category,
  count(DISTINCT "userId") FILTER (WHERE "eventName" = 'website_saved') AS saved_website,
  count(DISTINCT "userId") FILTER (WHERE "eventName" = 'sync_completed') AS synced_data,
  count(DISTINCT "userId") FILTER (WHERE "eventName" = 'board_shared') AS shared_board
FROM "AnalyticsEvent"
WHERE "userId" IS NOT NULL
GROUP BY 1;
