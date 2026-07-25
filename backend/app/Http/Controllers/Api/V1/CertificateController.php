<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Certificate\Models\Certificate;
use App\Domains\Core\Traits\ApiResponse;
use Illuminate\Http\Request;

class CertificateController extends ApiController
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Certificate::with(['user:id,name,email', 'course:id,title']);

        // Only Admin or Teacher can see all certificates.
        $user = $request->user();
        if ($user->role === 'student') {
            $query->where('user_id', $user->id);
        } else if ($user->role === 'teacher') {
            // Teacher can see certificates for courses they teach
            $query->whereHas('course', function($q) use ($user) {
                $q->where('teacher_id', $user->id);
            });
        }

        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        $certificates = $query->latest()->get();

        return $this->success($certificates);
    }
}
