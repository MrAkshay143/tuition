<?php

namespace App\Domains\Core\Requests\Student;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class SendStudentNotificationRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $student = User::students()->findOrFail($this->route('id'));
        return Gate::allows('sendNotification', $student);
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string',
            'body'  => 'required|string'
        ];
    }
}
