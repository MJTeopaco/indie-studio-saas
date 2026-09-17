# =============================================================================
# Stage 1: Node — Build the Vite/React frontend assets
# =============================================================================
FROM node:22-alpine AS node-builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source files needed for the build
COPY vite.config.js tailwind.config.js postcss.config.js jsconfig.json ./
COPY resources/ resources/
COPY public/ public/

# Build production assets into public/build/
RUN npm run build


# =============================================================================
# Stage 2: Composer — Install PHP production dependencies
# =============================================================================
FROM composer:2.8 AS composer-builder

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --optimize-autoloader \
    --prefer-dist


# =============================================================================
# Stage 3: Production image — PHP 8.3 + Apache
# =============================================================================
FROM php:8.3-apache AS production

# ── System dependencies ──────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        zip \
        unzip \
        curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        zip \
        gd \
        pcntl \
        bcmath \
        opcache \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── Apache configuration ─────────────────────────────────────────────────────
# Enable mod_rewrite for Laravel's pretty URLs
RUN a2enmod rewrite headers

# Point DocumentRoot at Laravel's public/ directory
ENV APACHE_DOCUMENT_ROOT /var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/apache2.conf \
        /etc/apache2/conf-available/*.conf

# Allow .htaccess overrides inside the public directory
RUN sed -i 's/AllowOverride None/AllowOverride All/g' \
        /etc/apache2/apache2.conf

# ── PHP configuration ─────────────────────────────────────────────────────────
COPY docker/php/php.ini /usr/local/etc/php/conf.d/app.ini

# ── Application code ──────────────────────────────────────────────────────────
WORKDIR /var/www/html

# Copy the full application
COPY . .

# Overlay build artefacts from the previous stages
COPY --from=node-builder /app/public/build public/build/
COPY --from=composer-builder /app/vendor vendor/

# ── Permissions ───────────────────────────────────────────────────────────────
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["apache2-foreground"]
