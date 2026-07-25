<?php

namespace App\Domains\Core\Actions\Admin;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;

class ToggleAdminUserStatusAction
{
    public function execute(int $userId, bool $isActive): User
    {
        $user = User::findOrFail($userId);
        $user->update(['active' => $isActive]);

        if (!$user->active) {
            $user->tokens()->delete(); // Force logout when disabled
        }

        $status = $user->active ? 'enabled' : 'disabled';
        ActivityLog::record('updated', "Admin {$status} user: {$user->name}");

        return $user;
    }
}
