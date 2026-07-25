<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Certificate\Models\Certificate;
use App\Domains\Core\Traits\ApiResponse;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Gate;

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

    public function download(Request $request, $id)
    {
        $certificate = Certificate::with(['user', 'course.teacher'])->findOrFail($id);

        // Ensure the user has permission to download it
        $user = $request->user();
        if ($user->role === 'student' && $certificate->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized access to certificate.'], 403);
        } else if ($user->role === 'teacher' && $certificate->course->teacher_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized access to certificate.'], 403);
        }

        $data = [
            'studentName' => $certificate->user->name,
            'courseName' => $certificate->course->title,
            'teacherName' => $certificate->course->teacher ? $certificate->course->teacher->name : 'Platform Instructor',
            'date' => $certificate->created_at->format('F d, Y'),
            'certificateId' => $certificate->certificate_id ?? 'CERT-' . str_pad($certificate->id, 6, '0', STR_PAD_LEFT),
        ];

        // Sanitize filename to prevent directory traversal or invalid characters
        $safeFilename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $data['certificateId']) . '.pdf';

        $pdf = Pdf::loadView('certificate', $data)
            ->setPaper('a4', 'landscape');

        return $pdf->download($safeFilename, [
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => 'Sat, 01 Jan 2000 00:00:00 GMT',
        ]);
    }
}
