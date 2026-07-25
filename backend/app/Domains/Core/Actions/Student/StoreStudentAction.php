<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;
use App\Domains\Core\DTOs\Student\StoreStudentData;

class StoreStudentAction
{
    /**
     * Execute the action.
     */
    public function execute(StoreStudentData $data): User
    {
        $student = User::create([
            'name'     => $data->name,
            'email'    => $data->email,
            'password' => Hash::make($data->password),
            'phone'    => $data->phone,
            'role'     => 'student',
            'active'   => true,
        ]);

        ActivityLog::record('created', "Created student account: {$student->name}");

        return $student;
    }
}

