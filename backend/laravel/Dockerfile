FROM php:8.4-cli-alpine

RUN apk add --no-cache postgresql-dev libxml2-dev oniguruma-dev $PHPIZE_DEPS \
    && docker-php-ext-install dom mbstring pdo_pgsql xml xmlwriter

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

EXPOSE 8000

# Listens on $PORT when the host provides one (Render), 8000 otherwise
# (Docker Compose). RUN_MIGRATIONS=true is set only in deployed
# environments: it applies pending migrations and caches config/routes
# before serving. PHP_CLI_SERVER_WORKERS lets `artisan serve` handle
# requests in parallel.
CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS\" = \"true\" ]; then php artisan migrate --force && php artisan config:cache && php artisan route:cache; fi && exec php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
