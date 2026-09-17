#!/bin/sh
set -e

echo "▶ Running Laravel bootstrap..."

# In Docker, APP_KEY must be set as an environment variable in Render.
# We do NOT run key:generate because there is no .env file to write to.
if [ -z "$APP_KEY" ]; then
  echo "❌ ERROR: APP_KEY environment variable is not set. Aborting."
  exit 1
fi

# Run migrations (the --force flag skips the production prompt)
php artisan migrate --force

# Finish the composer post-install step we skipped in the build stage
php artisan package:discover --ansi

# Optimize the application for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Link storage
php artisan storage:link --force 2>/dev/null || true

echo "✅ Bootstrap complete. Starting Apache..."

exec "$@"
