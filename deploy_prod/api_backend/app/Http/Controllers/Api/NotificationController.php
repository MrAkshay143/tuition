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

        return response()->json([
            'data'        => $items->items(),
            'next_cursor' => $items->nextCursor()?->encode(),
        ]);
    }

    public function unreadCount(
        \App\Domains\Engagement\Requests\GetUnreadNotificationsCountRequest $request,
        \App\Domains\Engagement\Actions\GetUnreadNotificationsCountAction $action
    ) {
        $count = $action->execute($request->user()->id);
        return response()->json(['data' => ['count' => $count]]);
    }

    public function markRead(
        \App\Domains\Engagement\Requests\MarkNotificationReadRequest $request,
        \App\Domains\Engagement\Actions\MarkNotificationReadAction $action,
        string $id
    ) {
        $action->execute($request->user()->id, $id);
        return response()->json(['message' => 'Marked as read.']);
    }

    public function markAllRead(
        \App\Domains\Engagement\Requests\MarkAllNotificationsReadRequest $request,
        \App\Domains\Engagement\Actions\MarkAllNotificationsReadAction $action
    ) {
        $action->execute($request->user()->id);
        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function preferences(
        \App\Domains\Engagement\Requests\GetNotificationPreferencesRequest $request,
        \App\Domains\Engagement\Actions\GetNotificationPreferencesAction $action
    ) {
        $prefs = $action->execute($request->user()->id);
        return response()->json(['data' => $prefs->toArray()]);
    }

    public function updatePreferences(
        \App\Domains\Engagement\Requests\UpdateNotificationPreferencesRequest $request,
        \App\Domains\Engagement\Actions\UpdateNotificationPreferencesAction $action
    ) {
        $prefs = $action->execute($request->user()->id, $request->validated());
        return response()->json(['data' => $prefs->toArray(), 'message' => 'Preferences updated']);
    }

    public function destroy(
        \App\Domains\Engagement\Requests\GetNotificationsRequest $request,
        string $id
    ) {
        \App\Models\Notification::where('user_id', $request->user()->id)->where('id', $id)->delete();
        return response()->json(['message' => 'Notification deleted']);
    }

    public function updateFcmToken(Request $request)
    {
        $validated = $request->validate(['fcm_token' => 'required|string']);
        $request->user()->update(['fcm_token' => $validated['fcm_token']]);
        return response()->json(['message' => 'FCM token updated successfully']);
    }
}
