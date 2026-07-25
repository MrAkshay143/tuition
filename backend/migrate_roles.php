<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach(\App\Domains\Core\Models\User::all() as $u) {
    if($u->role) {
        try {
            $u->assignRole($u->role);
            echo "Assigned {$u->role} to {$u->email}\n";
        } catch (\Exception $e) {
            echo "Could not assign role to {$u->email}: {$e->getMessage()}\n";
        }
    }
}
