-- D5-09: least-privilege grants for the Go-analytics login role.
--
-- Runs in two paths with the same file: automatically by the postgres image on
-- fresh-volume init (via /docker-entrypoint-initdb.d, alphabetically after
-- 01-analytics-role.sh which creates the role), and once explicitly via
-- `docker exec ... psql < this file` against the long-lived seeded volume.
-- D5-10 switches Go to this role; the matrix below is then re-proven live.
--
-- Grant shape (all idempotent — safe to re-run on every fresh init):
--   * USAGE ON SCHEMA public: lets the role *reach* objects in the schema.
--   * SELECT on exactly the tables Go reads (businesses, categories, reviews —
--     derived from FROM/JOIN in internal/repository/postgres.go). No sequences
--     (Go never calls nextval), no framework tables, no writes anywhere.
--   * ALTER DEFAULT PRIVILEGES FOR ROLE caribeops: tables created in the future
--     by the migration owner inherit SELECT for analytics, so the next
--     table-adding migration cannot silently break the analytics service.
--     (Owner verified via pg_tables: all public tables owned by caribeops.)
GRANT USAGE ON SCHEMA public TO analytics;
GRANT SELECT ON businesses, categories, reviews TO analytics;
ALTER DEFAULT PRIVILEGES FOR ROLE caribeops IN SCHEMA public
    GRANT SELECT ON TABLES TO analytics;
