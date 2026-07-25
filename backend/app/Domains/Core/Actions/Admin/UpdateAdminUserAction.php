<?php

namespace App\Domains\Core\Actions\Admin;

use App\Domains\Core\Models\User;
use App\Domains\Core\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;

class UpdateAdminUserAction
{
    public function execute(int $userId, array $data): User
    {
        $user = User::findOrFail($userId);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
            $user->tokens()->delete();
        } else {
            unset($data['password']);
        }

        $user->update($data);
        ActivityLog::record('updated', "Admin updated user: {$user->name}");

        return $user->fresh();
    }
}
