#!/usr/bin/env bash
# Dumps the production Supabase db (structure + content) into db-backups/.
# Read-only against prod — does not touch dev or modify prod in any way.
#
# Usage:
#   ./scripts/save-prod-db.sh
#
# Reads PROD_DB_PASSWORD from .env (project root) — the "Database Password"
# from the prod Supabase project's Settings > Database page.

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

# ── Project reference ─────────────────────────────────────────────────────────
PROD_REF="mjplaskfbnilygzpwgjy"

# ── Password check ────────────────────────────────────────────────────────────
if [[ -z "${PROD_DB_PASSWORD:-}" ]]; then
  echo "Error: PROD_DB_PASSWORD must be set in .env"
  exit 1
fi

# ── Connection string ─────────────────────────────────────────────────────────
PROD_URL="postgresql://postgres:${PROD_DB_PASSWORD}@db.${PROD_REF}.supabase.co:5432/postgres"

# ── Output location ───────────────────────────────────────────────────────────
BACKUP_DIR="$SCRIPT_DIR/../db-backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
PUBLIC_DUMP="$BACKUP_DIR/prod_public_${TIMESTAMP}.dump"
AUTH_DUMP="$BACKUP_DIR/prod_auth_${TIMESTAMP}.dump"
JSON_DIR="$BACKUP_DIR/prod_json_${TIMESTAMP}"

# ── 1. Dump public schema (structure + data) ──────────────────────────────────
echo "==> [1/3] Dumping prod public schema (structure + content)..."
pg_dump \
  --format=custom \
  --no-owner \
  --schema=public \
  "$PROD_URL" \
  --file="$PUBLIC_DUMP"
echo "    Done ($(du -h "$PUBLIC_DUMP" | cut -f1))"

# ── 2. Dump auth users (data-only, needed to restore FK-linked data) ─────────
echo "==> [2/3] Dumping prod auth users..."
pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --data-only \
  --table=auth.users \
  --table=auth.identities \
  "$PROD_URL" \
  --file="$AUTH_DUMP"
echo "    Done ($(du -h "$AUTH_DUMP" | cut -f1))"

# ── 3. Export each public table as JSON (for quick human inspection) ─────────
echo "==> [3/3] Exporting public tables as JSON..."
mkdir -p "$JSON_DIR"
TABLES=$(psql "$PROD_URL" -At -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;")
for TABLE in $TABLES; do
  QUERY="SELECT coalesce(json_agg(t), '[]'::json) FROM public.\"$TABLE\" t"
  if command -v jq &>/dev/null; then
    psql "$PROD_URL" -At -c "$QUERY" | jq . > "$JSON_DIR/${TABLE}.json"
  else
    psql "$PROD_URL" -At -c "$QUERY" > "$JSON_DIR/${TABLE}.json"
  fi
done
echo "    Done ($(echo "$TABLES" | wc -l) tables)"

echo ""
echo "  Backup saved to:"
echo "    $PUBLIC_DUMP"
echo "    $AUTH_DUMP"
echo "    $JSON_DIR/"
