<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::first();
echo "Testing with email: {$user->email}\n";

$status = \Illuminate\Support\Facades\Password::sendResetLink(['email' => $user->email]);

echo "Status: " . __($status) . "\n";

$jobs = \Illuminate\Support\Facades\DB::table('jobs')->count();
echo "Jobs in queue: $jobs\n";
