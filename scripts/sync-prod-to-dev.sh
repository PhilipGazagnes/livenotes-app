#!/usr/bin/env bash
# Drops the dev public schema and restores a fresh dump from prod.
# Also syncs auth.users from prod so FK constraints are satisfied.
# Dev DB will exactly mirror prod after this runs.
#
# Usage:
#   ./scripts/sync-prod-to-dev.sh
#
# Reads PROD_DB_PASSWORD and DEV_DB_PASSWORD from .env (project root).
# Both are the "Database Password" from each Supabase project's
# Settings > Database page.

set -euo pipefail

# ── Load .env ─────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# ── Project references ────────────────────────────────────────────────────────
PROD_REF="mjplaskfbnilygzpwgjy"
DEV_REF="qmnbjnyypyhiachhqilh"

# ── Password check ────────────────────────────────────────────────────────────
if [[ -z "${PROD_DB_PASSWORD:-}" || -z "${DEV_DB_PASSWORD:-}" ]]; then
  echo "Error: PROD_DB_PASSWORD and DEV_DB_PASSWORD must be set in .env"
  exit 1
fi

# ── Connection strings ────────────────────────────────────────────────────────
PROD_URL="postgresql://postgres:${PROD_DB_PASSWORD}@db.${PROD_REF}.supabase.co:5432/postgres"
DEV_URL="postgresql://postgres:${DEV_DB_PASSWORD}@db.${DEV_REF}.supabase.co:5432/postgres"

# ── Safety confirmation ───────────────────────────────────────────────────────
echo ""
echo "  This will WIPE the dev database (${DEV_REF}) and replace it with prod data."
echo ""
read -r -p "  Type YES to continue: " confirm
if [[ "$confirm" != "YES" ]]; then
  echo "Aborted."
  exit 0
fi
echo ""

# ── Temp files (auto-cleaned) ─────────────────────────────────────────────────
PUBLIC_DUMP=$(mktemp /tmp/prod_public_XXXXXX.dump)
AUTH_DUMP=$(mktemp /tmp/prod_auth_XXXXXX.dump)
RESTORE_LIST=$(mktemp /tmp/restore_list_XXXXXX.txt)
trap 'rm -f "$PUBLIC_DUMP" "$AUTH_DUMP" "$RESTORE_LIST"' EXIT

# ── 1. Dump prod ──────────────────────────────────────────────────────────────
echo "==> [1/4] Dumping prod (public schema + auth users)..."
pg_dump \
  --format=custom \
  --no-owner \
  --schema=public \
  "$PROD_URL" \
  --file="$PUBLIC_DUMP"

# Dump only auth.users and auth.identities (needed for FK constraints)
pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --data-only \
  --table=auth.users \
  --table=auth.identities \
  "$PROD_URL" \
  --file="$AUTH_DUMP"

echo "    Done (public: $(du -h "$PUBLIC_DUMP" | cut -f1), auth: $(du -h "$AUTH_DUMP" | cut -f1))"

# ── 2. Wipe dev public schema ─────────────────────────────────────────────────
echo "==> [2/4] Wiping dev public schema..."
psql "$DEV_URL" --quiet <<'SQL'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- pg_dump sets "search_path = ''" for the entire restore session.
-- The dump's immutable_unaccent function calls unaccent($1) without a schema prefix,
-- so with an empty search_path Postgres can't resolve it during CREATE TABLE.
-- Fix: install the extension in public, then pre-create the function with an explicit
-- public.unaccent($1) call. pg_restore's own CREATE FUNCTION will fail (already exists)
-- and keep our corrected version, allowing artists_v2/songs_v2 to be created.
DROP EXTENSION IF EXISTS unaccent;
CREATE EXTENSION unaccent SCHEMA public;

CREATE FUNCTION public.immutable_unaccent(text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    AS $$ SELECT public.unaccent($1) $$;
SQL
echo "    Done."

# ── 3. Sync auth users from prod ──────────────────────────────────────────────
echo "==> [3/4] Syncing auth users from prod..."
# Wipe existing dev auth users; CASCADE clears dependent auth tables (sessions, tokens, etc.)
psql "$DEV_URL" --quiet -c "TRUNCATE auth.identities; TRUNCATE auth.users CASCADE;"
pg_restore \
  --no-owner \
  --no-acl \
  --data-only \
  --dbname="$DEV_URL" \
  "$AUTH_DUMP"
echo "    Done."

# ── 4. Restore public schema from prod ───────────────────────────────────────
echo "==> [4/4] Restoring prod public schema into dev..."
# Build a filtered TOC that excludes immutable_unaccent (already pre-created in step 2)
pg_restore --list "$PUBLIC_DUMP" \
  | grep -v "FUNCTION public immutable_unaccent" \
  | grep -v "SCHEMA - public" \
  | grep -v "DEFAULT ACL" \
  > "$RESTORE_LIST"

pg_restore \
  --no-owner \
  --use-list="$RESTORE_LIST" \
  --dbname="$DEV_URL" \
  "$PUBLIC_DUMP"
echo "    Done."

echo ""
echo "  Dev DB now mirrors prod."
