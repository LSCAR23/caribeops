FROM php:8.4-cli-alpine

RUN apk add --no-cache postgresql-dev libxml2-dev oniguruma-dev $PHPIZE_DEPS \
    && docker-php-ext-install dom mbstring pdo_pgsql xml xmlwriter

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
