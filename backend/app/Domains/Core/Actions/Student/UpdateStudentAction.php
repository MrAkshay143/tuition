<?php

namespace App\Domains\Core\Actions\Student;

use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;
use App\Domains\Core\DTOs\Student\UpdateStudentData;

class UpdateStudentAction
{
    /**
     * Execute the action.
     */
    public function execute(UpdateStudentData $data): User
    {
        $student = User::students()->findOrFail($data->id);

        $updatePayload = [];

        if ($data->name !== null) {
            $updatePayload['name'] = $data->name;
        }

        if ($data->email !== null) {
            $updatePayload['email'] = $data->email;
        }

        if ($data->phone !== null) {
            $updatePayload['phone'] = $data->phone;
        }

        if ($data->password !== null) {
            $updatePayload['password'] = Hash::make($data->password);
        }

        if (!empty($updatePayload)) {
            $student->update($updatePayload);
            ActivityLog::record('updated', "Updated student: {$student->name}");
        }

        return $student->fresh();
    }
}

