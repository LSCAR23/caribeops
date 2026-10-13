#!/bin/sh
# D5-08: create the dedicated Go-analytics login role (idempotent).
#
# Runs in two paths with the same file: automatically by the postgres image on
# fresh-volume init (via /docker-entrypoint-initdb.d), and once explicitly via
# `docker exec` against the long-lived seeded volume (init scripts never run on
# existing volumes). D5-09 adds the read-only grants; D5-10 switches Go to it.
#
# The password arrives via $ANALYTICS_DB_PASSWORD (service environment), never
# baked into this file. It is forwarded to psql as a -v variable and spliced
# with :'pwd' so psql quotes it as a string literal (safe against quotes and
# other special characters). Two psql subtleties this shape respects, both found
# the hard way during D5-08: interpolation is skipped inside dollar-quoted DO
# bodies (so the existence check is a plain SELECT the shell branches on), and
# :'var' splicing works in script input (heredoc/stdin) but not in -c strings
# (so CREATE/ALTER run as heredocs, not -c arguments). No secrets are echoed.
set -eu

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${ANALYTICS_DB_PASSWORD:?ANALYTICS_DB_PASSWORD is required}"

exists=$(psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAX \
    -c "SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='analytics'")
if [ "$exists" != "1" ]; then
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -v "pwd=$ANALYTICS_DB_PASSWORD" <<'EOSQL'
CREATE ROLE analytics WITH LOGIN PASSWORD :'pwd';
EOSQL
fi
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -v "pwd=$ANALYTICS_DB_PASSWORD" <<'EOSQL'
ALTER ROLE analytics WITH LOGIN PASSWORD :'pwd';
EOSQL
