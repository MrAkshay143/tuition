<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Content Library Configuration
    |--------------------------------------------------------------------------
    */

    'allowed_mimes' => [
        // Video
        'video/mp4', 'video/mpeg', 'video/ogg', 'video/quicktime', 'video/webm', 'video/x-ms-wmv', 'video/x-flv', 'video/3gpp',
        // Document
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'application/rtf',
        // Image
        'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
        // Audio
        'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/aac',
        // Archive
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/x-gzip'
    ],

    'max_upload_size' => 2097152000, // 2GB in bytes

    'video_providers' => ['local', 'youtube', 'vimeo', 'external'],

    'recycle_bin_retention_days' => 30,

    'thumbnail' => [
        'generate' => true,
        'width' => 640,
        'height' => 360,
    ],
];
