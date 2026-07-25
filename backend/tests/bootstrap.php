<?php

/**
 * PHPUnit bootstrap for EduFlow.
 *
 * Clears the Artisan config/route/event cache before the test run to prevent
 * cached Mockery-wrapped objects (e.g., OutputStyle) from leaking into tests.
 * This is necessary when `php artisan optimize` has been run on a dev machine.
 */

// Delete cached bootstrap files if they exist
$cacheFiles = [
    __DIR__ . '/../bootstrap/cache/config.php',
    __DIR__ . '/../bootstrap/cache/routes-v7.php',
    __DIR__ . '/../bootstrap/cache/events.php',
    __DIR__ . '/../bootstrap/cache/packages.php',
];

foreach ($cacheFiles as $file) {
    if (file_exists($file)) {
        @unlink($file);
    }
}

// Load Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';
