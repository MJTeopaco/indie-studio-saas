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
#   postgresql://user:password@host/dbname  (no port)
#   postgresql://user:password@host:5432/dbname  (with port)
# We use PHP's parse_url() to handle all edge cases robustly.
if [ -n "$DATABASE_URL" ]; then
  eval $(php -r '
    $url = parse_url(getenv("DATABASE_URL"));
    if (!$url) { fwrite(STDERR, "❌ Could not parse DATABASE_URL\n"); exit(1); }
    echo "export DB_HOST=" . escapeshellarg($url["host"] ?? "127.0.0.1") . "\n";
    echo "export DB_PORT=" . escapeshellarg($url["port"] ?? "5432") . "\n";
    echo "export DB_DATABASE=" . escapeshellarg(ltrim($url["path"] ?? "/laravel", "/")) . "\n";
    echo "export DB_USERNAME=" . escapeshellarg($url["user"] ?? "") . "\n";
    echo "export DB_PASSWORD=" . escapeshellarg($url["pass"] ?? "") . "\n";
    echo "export DB_CONNECTION=pgsql" . "\n";
    fwrite(STDERR, "✅ Parsed DATABASE_URL → host=" . ($url["host"] ?? "?") . " db=" . ltrim($url["path"] ?? "", "/") . "\n");
  ')
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
