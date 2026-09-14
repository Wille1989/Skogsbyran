#!/bin/sh

set -e

php artisan package:discover --ansi
php artisan migrate --force

exec apache2-foreground