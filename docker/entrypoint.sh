#!/bin/sh
set -e

echo "▶ Running Laravel bootstrap..."

# Generate app key if not set
php artisan key:generate --force

# Run migrations (the --force flag skips the production prompt)
php artisan migrate --force

# Optimize the application for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Link storage
php artisan storage:link --force 2>/dev/null || true

echo "✅ Bootstrap complete. Starting Apache..."

exec "$@"
