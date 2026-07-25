<?php

namespace App\Domains\Core\Actions\Admin;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;

class StoreAdminUserAction
{
    public function execute(array $data): User
    {
        $user = User::create([
            ...$data,
            'password' => Hash::make($data['password']),
            'active' => true
        ]);
        
        ActivityLog::record('created', "Admin created user: {$user->name} ({$user->role})");

        return $user;
    }
}
