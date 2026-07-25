<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\ApiController;
use App\Domains\Academic\Models\AcademicSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AcademicSessionController extends ApiController
{
    public function index(): JsonResponse
    {
        $sessions = AcademicSession::withCount('programs')
            ->withTrashed()
            ->latest()
            ->get();
        
        $stats = [
            'total_sessions' => $sessions->count(),
            'current_session'=> $sessions->where('is_current', true)->first()?->name ?? 'None',
            'total_programs' => \App\Domains\Academic\Models\Program::count(),
            'total_students' => \App\Domains\Core\Models\User::students()->active()->count(),
        ];

        return response()->json([
            'status'  => 'success',
            'message' => 'Academic sessions retrieved.',
            'data'    => $sessions,
            'stats'   => $stats,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100|unique:academic_sessions,name',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
            'is_current' => 'boolean',
            'is_active'  => 'boolean',
        ]);

        // Only one session can be current
        if (!empty($data['is_current'])) {
            AcademicSession::where('is_current', true)->update(['is_current' => false]);
        }

        $session = AcademicSession::create($data);
        return $this->success($session, 'Academic session created.');
    }

    public function show(int $id): JsonResponse
    {
        $session = AcademicSession::withCount('programs')->findOrFail($id);
        return $this->success($session);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $session = AcademicSession::findOrFail($id);
        $data = $request->validate([
            'name'       => 'sometimes|string|max:100|unique:academic_sessions,name,' . $id,
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
            'is_current' => 'boolean',
            'is_active'  => 'boolean',
        ]);

        if (!empty($data['is_current'])) {
            AcademicSession::where('is_current', true)->where('id', '!=', $id)->update(['is_current' => false]);
        }

        $session->update($data);
        return $this->success($session, 'Academic session updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        $session = AcademicSession::findOrFail($id);
        if ($session->programs()->exists()) {
            return $this->error('Cannot delete: session has associated programs.', 422);
        }
        $session->delete();
        return $this->success(null, 'Academic session deleted.');
    }

    public function restore(int $id): JsonResponse
    {
        $session = AcademicSession::withTrashed()->findOrFail($id);
        $session->restore();
        return $this->success($session, 'Academic session restored.');
    }
}
