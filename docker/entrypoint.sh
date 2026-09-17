#!/bin/sh
set -e

echo "▶ Running Laravel bootstrap..."

# ── Validate required env vars ────────────────────────────────────────────────
if [ -z "$APP_KEY" ]; then
  echo "❌ ERROR: APP_KEY environment variable is not set. Aborting."
  exit 1
fi

# ── Parse DATABASE_URL into individual DB_* vars that Laravel reads ───────────
# Render injects DATABASE_URL as a full connection string, e.g.:
#   postgresql://user:password@host:5432/dbname
# Laravel's pgsql driver reads DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME,
# DB_PASSWORD individually — not DATABASE_URL — so we parse it here.
if [ -n "$DATABASE_URL" ]; then
  # Strip the scheme (postgresql:// or postgres://)
  DB_URL_STRIPPED=$(echo "$DATABASE_URL" | sed 's|^postgresql://||' | sed 's|^postgres://||')

  # Extract user:password and host:port/dbname
  DB_USERINFO=$(echo "$DB_URL_STRIPPED" | cut -d'@' -f1)
  DB_HOSTINFO=$(echo "$DB_URL_STRIPPED" | cut -d'@' -f2)

  export DB_USERNAME=$(echo "$DB_USERINFO" | cut -d':' -f1)
  export DB_PASSWORD=$(echo "$DB_USERINFO" | cut -d':' -f2)
  export DB_HOST=$(echo "$DB_HOSTINFO" | cut -d':' -f1)
  export DB_PORT=$(echo "$DB_HOSTINFO" | cut -d':' -f2 | cut -d'/' -f1)
  export DB_DATABASE=$(echo "$DB_HOSTINFO" | cut -d'/' -f2 | cut -d'?' -f1)
  export DB_CONNECTION=pgsql

  echo "✅ Parsed DATABASE_URL → host=$DB_HOST db=$DB_DATABASE user=$DB_USERNAME"
else
  echo "⚠️  DATABASE_URL not set — falling back to individual DB_* env vars."
fi

# ── Run migrations ────────────────────────────────────────────────────────────
php artisan migrate --force

# ── Finish composer post-install step (skipped in build with --no-scripts) ────
php artisan package:discover --ansi

# ── Optimize for production ───────────────────────────────────────────────────
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ── Link storage ──────────────────────────────────────────────────────────────
php artisan storage:link --force 2>/dev/null || true

echo "✅ Bootstrap complete. Starting Apache..."

exec "$@"
