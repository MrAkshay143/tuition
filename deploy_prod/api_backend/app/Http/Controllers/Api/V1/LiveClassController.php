<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\LiveClass\Models\LiveClass;
use App\Domains\LiveClass\Models\LiveClassAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LiveClassController extends ApiController
{
    public function index(
        \App\Domains\Engagement\Requests\GetLiveClassesRequest $request,
        \App\Domains\Engagement\Actions\GetLiveClassesAction $action
    ) {
        $classes = $action->execute($request->user(), $request->all());
        return $this->paginated($classes, 'Live classes retrieved successfully');
    }

    public function store(
        \App\Domains\Engagement\Requests\StoreLiveClassRequest $request,
        \App\Domains\Engagement\Actions\StoreLiveClassAction $action
    ) {
        $liveClass = $action->execute($request->validated(), $request->user()->id);
        return $this->success($liveClass, 'Live class created successfully', 201);
    }

    public function show(Request $request, $id)
    {
        $liveClass = LiveClass::with('batches')->findOrFail($id);

        if ($request->user()->isTeacher() && $liveClass->teacher_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        if ($request->user()->isStudent()) {
            $hasAccess = DB::table('enrollments')
                ->where('user_id', $request->user()->id)
                ->whereIn('batch_id', $liveClass->batches->pluck('id'))
                ->exists();
            if (!$hasAccess) {
                return $this->error('Unauthorized', 403);
            }
        }

        return $this->success($liveClass, 'Live class details retrieved successfully');
    }

    public function update(
        \App\Domains\Engagement\Requests\UpdateLiveClassRequest $request,
        \App\Domains\Engagement\Actions\UpdateLiveClassAction $action,
        $id
    ) {
        $liveClass = LiveClass::findOrFail($id);
        $liveClass = $action->execute($liveClass, $request->validated());

        return $this->success($liveClass, 'Live class updated successfully');
    }

    public function destroy(
        \App\Domains\Engagement\Requests\DeleteLiveClassRequest $request,
        \App\Domains\Engagement\Actions\DeleteLiveClassAction $action,
        $id
    ) {
        $liveClass = LiveClass::findOrFail($id);
        $action->execute($liveClass);

        return $this->success(null, 'Live class deleted successfully');
    }

    public function start(Request $request, $id)
    {
        $liveClass = LiveClass::findOrFail($id);
        if ($request->user()->isTeacher() && $liveClass->teacher_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        $liveClass->update(['status' => 'live', 'started_at' => now()]);
        return $this->success($liveClass, 'Live class started');
    }

    public function end(Request $request, $id)
    {
        $liveClass = LiveClass::findOrFail($id);
        if ($request->user()->isTeacher() && $liveClass->teacher_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        $liveClass->update(['status' => 'completed', 'ended_at' => now()]);
        return $this->success($liveClass, 'Live class ended');
    }

    public function recordAttendance(
        \App\Domains\Engagement\Requests\RecordAttendanceRequest $request,
        \App\Domains\Engagement\Actions\RecordAttendanceAction $action,
        $id
    ) {
        $liveClass = LiveClass::findOrFail($id);

        $hasAccess = DB::table('enrollments')
            ->where('user_id', $request->user()->id)
            ->whereIn('batch_id', $liveClass->batches->pluck('id'))
            ->exists();

        if (!$hasAccess) {
            return $this->error('Unauthorized', 403);
        }

        $attendance = $action->execute($liveClass, $request->user(), $request->validated());

        return $this->success($attendance, 'Attendance recorded successfully');
    }

    public function getAttendance(Request $request, $id)
    {
        $liveClass = LiveClass::findOrFail($id);

        if ($request->user()->isTeacher() && $liveClass->teacher_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        $attendance = LiveClassAttendance::where('live_class_id', $id)
            ->with('student:id,name,email')
            ->get();

        return $this->success($attendance, 'Attendance retrieved successfully');
    }
}
