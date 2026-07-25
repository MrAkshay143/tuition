<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\ApiController;
use Illuminate\Http\Request;

class NotificationController extends ApiController
{
    public function index(
        \App\Domains\Engagement\Requests\GetNotificationsRequest $request,
        \App\Domains\Engagement\Actions\GetNotificationsAction $action
    ) {
        $perPage = min((int)($request->per_page ?? 20), 50);
        $items = $action->execute($request->user()->id, $request->type, $perPage);

        return $this->success($items->items(), '', 200, [
            'next_cursor' => $items->nextCursor()?->encode(),
        ]);
    }

    public function unreadCount(
        \App\Domains\Engagement\Requests\GetUnreadNotificationsCountRequest $request,
        \App\Domains\Engagement\Actions\GetUnreadNotificationsCountAction $action
    ) {
        $count = $action->execute($request->user()->id);
        return $this->success(['count' => $count]);
    }

    public function markRead(
        \App\Domains\Engagement\Requests\MarkNotificationReadRequest $request,
        \App\Domains\Engagement\Actions\MarkNotificationReadAction $action,
        string $id
    ) {
        $action->execute($request->user()->id, $id);
        return $this->success(null, 'Marked as read.');
    }

    public function markAllRead(
        \App\Domains\Engagement\Requests\MarkAllNotificationsReadRequest $request,
        \App\Domains\Engagement\Actions\MarkAllNotificationsReadAction $action
    ) {
        $action->execute($request->user()->id);
        return $this->success(null, 'All notifications marked as read.');
    }

    public function preferences(
        \App\Domains\Engagement\Requests\GetNotificationPreferencesRequest $request,
        \App\Domains\Engagement\Actions\GetNotificationPreferencesAction $action
    ) {
        $prefs = $action->execute($request->user()->id);
        return $this->success($prefs->toArray());
    }

    public function updatePreferences(
        \App\Domains\Engagement\Requests\UpdateNotificationPreferencesRequest $request,
        \App\Domains\Engagement\Actions\UpdateNotificationPreferencesAction $action
    ) {
        $prefs = $action->execute($request->user()->id, $request->validated());
        return $this->success($prefs->toArray(), 'Preferences updated');
    }

    public function destroy(
        \App\Domains\Engagement\Requests\GetNotificationsRequest $request,
        string $id
    ) {
        \App\Models\Notification::where('user_id', $request->user()->id)->where('id', $id)->delete();
        return $this->success(null, 'Notification deleted');
    }

    public function updateFcmToken(Request $request)
    {
        $validated = $request->validate(['fcm_token' => 'required|string']);
        $request->user()->update(['fcm_token' => $validated['fcm_token']]);
        return $this->success(null, 'FCM token updated successfully');
    }
}

