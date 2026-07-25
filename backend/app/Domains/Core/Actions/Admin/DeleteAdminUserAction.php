<?php

namespace App\Domains\Core\Actions\Admin;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use App\Exceptions\DomainException;

class DeleteAdminUserAction
{
    public function execute(int $userId): void
    {
        $user = User::findOrFail($userId);

        if ($user->role === 'admin') {
            throw new DomainException('Cannot delete admin account.', 403);
        }

        $name = $user->name;
        $user->tokens()->delete();
        $user->delete();
        ActivityLog::record('deleted', "Admin deleted user: {$name}");
    }
}
