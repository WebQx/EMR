# WebQX™ EMR Docker Image
FROM php:8.3-apache

# Set working directory
WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    nodejs \
    npm \
    imagemagick \
    libmagickwand-dev \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    soap \
    intl \
    opcache

# Install additional PHP extensions
RUN pecl install redis imagick \
    && docker-php-ext-enable redis imagick

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy custom PHP configuration
COPY docker/php/php.ini /usr/local/etc/php/php.ini
COPY docker/php/webqx.conf /usr/local/etc/php/conf.d/webqx.conf

# Copy Apache configuration
COPY docker/apache/webqx-site.conf /etc/apache2/sites-available/000-default.conf
COPY docker/apache/apache2.conf /etc/apache2/apache2.conf

# Enable Apache modules
RUN a2enmod rewrite ssl headers expires deflate

# Create necessary directories
RUN mkdir -p /var/www/html/uploads \
    && mkdir -p /var/www/html/logs \
    && mkdir -p /var/log/webqx \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Copy application code
COPY . /var/www/html/

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 777 /var/www/html/uploads \
    && chmod -R 777 /var/www/html/logs

# Install Composer dependencies (if composer.json exists)
RUN if [ -f composer.json ]; then composer install --no-dev --optimize-autoloader; fi

# Install NPM dependencies (if package.json exists)
RUN if [ -f package.json ]; then npm install --production; fi

# Environment variables
ENV APACHE_DOCUMENT_ROOT=/var/www/html
ENV APACHE_LOG_DIR=/var/log/apache2
ENV WEBQX_VERSION=1.0.0
ENV PHP_MEMORY_LIMIT=512M
ENV PHP_MAX_EXECUTION_TIME=300
ENV PHP_UPLOAD_MAX_FILESIZE=100M
ENV PHP_POST_MAX_SIZE=100M

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/api/v2/status || exit 1

# Expose ports
EXPOSE 80 443

# Start Apache
CMD ["apache2-foreground"]
