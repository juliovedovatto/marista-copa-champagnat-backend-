FROM php:7.2-apache

RUN apt-get update && apt-get install -y apt-utils libjpeg62-turbo-dev libpng-dev libfreetype6-dev \
  && docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
  && docker-php-ext-install -j$(nproc) gd

RUN  docker-php-ext-install exif

RUN apt-get install -y libmcrypt-dev \
  && pecl install mcrypt-1.0.2 \
  && docker-php-ext-enable mcrypt

RUN a2enmod rewrite \
    && sed -i "s/<\/VirtualHost>/\n\t<Directory \/var\/www\/html>\n\t\tOptions Indexes FollowSymLinks\n\t\tAllowOverride All\n\t\tRequire all granted\n\t<\/Directory>\n\n<\/VirtualHost>/g" /etc/apache2/sites-enabled/000-default.conf \
    && sed -i "s/#LogLevel info ssl:warn/LogLevel alert rewrite:trace5 alias:debug/g" /etc/apache2/sites-enabled/000-default.conf

RUN mkdir -p /app/copachampagnat/backend/ && rm -fr /var/www/html && ln -s /app /var/www/html

WORKDIR /app/copachampagnat/backend/