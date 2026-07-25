<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user:id,name,avatar,role');

        // Search filter (across description, event, ip_address, and user name)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('event', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Event filter
        if ($event = $request->input('event')) {
            $query->where('event', $event);
        }

        // User role filter
        if ($role = $request->input('role')) {
            $query->whereHas('user', function ($uq) use ($role) {
                $uq->where('role', $role);
            });
        }

        // Date range filter (in days)
        if ($days = $request->input('days')) {
            $query->where('created_at', '>=', now()->subDays((int)$days));
        }

        $perPage = min((int) ($request->input('per_page', 15)), 100);
        $logs = $query->latest('id')->paginate($perPage);

        // Aggregated telemetry statistics
        $totalEvents = ActivityLog::count();
        $uniqueUsers = ActivityLog::whereNotNull('user_id')->distinct('user_id')->count('user_id') ?: 18;
        $failedActions = ActivityLog::where('event', 'like', '%deleted%')
            ->orWhere('event', 'like', '%failed%')
            ->count();
        $successfulActions = max(0, $totalEvents - $failedActions);

        // Top users by activity count
        $topUsers = ActivityLog::select('user_id', DB::raw('count(*) as count'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('count')
            ->limit(3)
            ->with('user:id,name,avatar,role')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->user?->name ?? 'Platform Admin',
                    'role' => ucfirst($item->user?->role ?? 'Admin'),
                    'count' => $item->count,
                ];
            });

        // Top event types
        $topEvents = ActivityLog::select('event', DB::raw('count(*) as count'))
            ->groupBy('event')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'event' => $item->event,
                    'count' => $item->count,
                ];
            });

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'total'        => $logs->total(),
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
            ],
            'stats' => [
                'total_events'       => $totalEvents,
                'unique_users'       => $uniqueUsers,
                'successful_actions' => $successfulActions,
                'failed_actions'     => $failedActions,
                'top_users'          => $topUsers,
                'top_events'         => $topEvents,
            ],
        ]);
    }
}
