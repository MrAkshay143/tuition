<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Core\Models\Announcement;
use App\Domains\Core\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class AnnouncementController extends \App\Http\Controllers\ApiController
{
    public function index(
        \App\Domains\Engagement\Requests\GetAnnouncementsRequest $request,
        \App\Domains\Engagement\Actions\GetAnnouncementsAction $action
    ) {
        $announcements = $action->execute($request->user());
        return $this->success($announcements, 'Announcements retrieved successfully');
    }

    public function store(
        \App\Domains\Engagement\Requests\StoreAnnouncementRequest $request,
        \App\Domains\Engagement\Actions\StoreAnnouncementAction $action
    ) {
        $announcement = $action->execute($request->validated(), $request->user()->id);
        return $this->success($announcement, 'Announcement created successfully', 201);
    }

    public function show(
        \App\Domains\Engagement\Requests\GetAnnouncementRequest $request,
        $id
    ) {
        $announcement = Announcement::findOrFail($id);
        return $this->success($announcement, 'Announcement retrieved');
    }

    public function destroy(
        \App\Domains\Engagement\Requests\DeleteAnnouncementRequest $request,
        \App\Domains\Engagement\Actions\DeleteAnnouncementAction $action,
        $id
    ) {
        $announcement = Announcement::findOrFail($id);
        $action->execute($announcement);
        return $this->success(null, 'Announcement deleted');
    }
}
