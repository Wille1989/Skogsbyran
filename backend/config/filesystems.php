<?php


$backblazeEndpoint = static function (?string $endpoint): ?string {
    if ($endpoint === null || $endpoint === '') {
        return null;
    }

    if (! str_starts_with($endpoint, 'http://') && ! str_starts_with($endpoint, 'https://')) {
        return 'https://'.$endpoint;
    }

    return $endpoint;
};

$backblazeRegionFromEndpoint = static function (?string $endpoint) use ($backblazeEndpoint): ?string {
    $endpoint = $backblazeEndpoint($endpoint);

    if ($endpoint === null) {
        return null;
    }

    $host = parse_url($endpoint, PHP_URL_HOST);

    if (! is_string($host)) {
        return null;
    }

    if (preg_match('/(?:^|\.)s3\.([a-z0-9-]+)\.backblazeb2\.com$/', $host, $matches) === 1) {
        return $matches[1];
    }

    return null;
};

return [

    'object_storage_prefix' => env('OBJECT_STORAGE_PREFIX', 'development'),

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        'images' => [
            'driver' => 's3',
            'key' => env('B2_ACCESS_KEY_ID'),
            'secret' => env('B2_SECRET_ACCESS_KEY'),
            'region' => env('B2_REGION', $backblazeRegionFromEndpoint(env('B2_IMAGES_ENDPOINT'))),
            'bucket' => env('B2_IMAGES_BUCKET'),
            'endpoint' => $backblazeEndpoint(env('B2_IMAGES_ENDPOINT')),
            'use_path_style_endpoint' => env('B2_USE_PATH_STYLE_ENDPOINT', false),
            'visibility' => 'private',
            'throw' => true,
            'report' => false,
        ],

        'documents' => [
            'driver' => 's3',
            'key' => env('B2_ACCESS_KEY_ID'),
            'secret' => env('B2_SECRET_ACCESS_KEY'),
            'region' => env('B2_REGION', $backblazeRegionFromEndpoint(env('B2_DOCUMENTS_ENDPOINT'))),
            'bucket' => env('B2_DOCUMENTS_BUCKET'),
            'endpoint' => $backblazeEndpoint(env('B2_DOCUMENTS_ENDPOINT')),
            'use_path_style_endpoint' => env('B2_USE_PATH_STYLE_ENDPOINT', false),
            'visibility' => 'private',
            'throw' => true,
            'report' => false,
        ],

        'r2' => [
            'driver' => 's3',
            'key' => env('R2_ACCESS_KEY_ID'),
            'secret' => env('R2_SECRET_ACCESS_KEY'),
            'region' => env('R2_REGION', 'auto'),
            'bucket' => env('R2_BUCKET'),
            'url' => env('R2_URL'),
            'endpoint' => env('R2_ENDPOINT'),
            'use_path_style_endpoint' => env('R2_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
