# PowerShell script to create Notification and Chat domain classes
$baseDir = "c:\Dev\Projects\Online Tuition\backend\app\Domains\Engagement"
$requestsDir = "$baseDir\Requests"
$actionsDir = "$baseDir\Actions"

New-Item -ItemType Directory -Force -Path $requestsDir | Out-Null
New-Item -ItemType Directory -Force -Path $actionsDir | Out-Null

# --- NOTIFICATION REQUESTS ---
Set-Content -Path "$requestsDir\GetNotificationsRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class GetNotificationsRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\GetUnreadNotificationsCountRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class GetUnreadNotificationsCountRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\MarkNotificationReadRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class MarkNotificationReadRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\MarkAllNotificationsReadRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class MarkAllNotificationsReadRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\GetNotificationPreferencesRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class GetNotificationPreferencesRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\UpdateNotificationPreferencesRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class UpdateNotificationPreferencesRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            "in_app"               => "boolean",
            "email"                => "boolean",
            "push"                 => "boolean",
            "live_class_reminder"  => "boolean",
            "assignment_due"       => "boolean",
            "exam_reminder"        => "boolean",
            "new_content"          => "boolean",
        ];
    }
}'

# --- CHAT REQUESTS ---
Set-Content -Path "$requestsDir\GetChatConversationsRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class GetChatConversationsRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\GetChatThreadRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
use App\Domains\Core\Models\User;
class GetChatThreadRequest extends ApiFormRequest {
    public function authorize(): bool {
        $partnerId = $this->route("partnerId");
        $user = $this->user();
        if ($user->isAdmin()) return true;
        if ($user->isTeacher()) {
            return \Illuminate\Support\Facades\DB::table("enrollments")
                ->join("batches", "enrollments.batch_id", "=", "batches.id")
                ->where("batches.teacher_id", $user->id)
                ->where("enrollments.user_id", $partnerId)
                ->exists();
        }
        if ($user->isStudent()) {
            return \Illuminate\Support\Facades\DB::table("enrollments")
                ->join("batches", "enrollments.batch_id", "=", "batches.id")
                ->where("enrollments.user_id", $user->id)
                ->where("batches.teacher_id", $partnerId)
                ->exists();
        }
        return false;
    }
    public function rules(): array { return []; }
}'
Set-Content -Path "$requestsDir\SendChatMessageRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class SendChatMessageRequest extends ApiFormRequest {
    public function authorize(): bool {
        $partnerId = $this->route("partnerId");
        $user = $this->user();
        if ($user->isAdmin()) return true;
        if ($user->isTeacher()) {
            return \Illuminate\Support\Facades\DB::table("enrollments")
                ->join("batches", "enrollments.batch_id", "=", "batches.id")
                ->where("batches.teacher_id", $user->id)
                ->where("enrollments.user_id", $partnerId)
                ->exists();
        }
        if ($user->isStudent()) {
            return \Illuminate\Support\Facades\DB::table("enrollments")
                ->join("batches", "enrollments.batch_id", "=", "batches.id")
                ->where("enrollments.user_id", $user->id)
                ->where("batches.teacher_id", $partnerId)
                ->exists();
        }
        return false;
    }
    public function rules(): array {
        return [
            "message" => "required|string",
            "attachment_url" => "nullable|url"
        ];
    }
}'
Set-Content -Path "$requestsDir\MarkChatReadRequest.php" -Value '<?php
namespace App\Domains\Engagement\Requests;
use App\Http\Requests\ApiFormRequest;
class MarkChatReadRequest extends ApiFormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array { return []; }
}'

# --- NOTIFICATION ACTIONS ---
Set-Content -Path "$actionsDir\NotificationActions.php" -Value '<?php
namespace App\Domains\Engagement\Actions;
use App\Models\Notification;
use App\Models\NotificationPreference;
use Illuminate\Contracts\Pagination\CursorPaginator;

class GetNotificationsAction {
    public function execute(int $userId, ?string $type, int $perPage): CursorPaginator {
        return Notification::where("user_id", $userId)
            ->when($type, fn($q, $t) => $q->where("type", $t))
            ->latest()
            ->cursorPaginate($perPage);
    }
}
class GetUnreadNotificationsCountAction {
    public function execute(int $userId): int {
        return Notification::where("user_id", $userId)->whereNull("read_at")->count();
    }
}
class MarkNotificationReadAction {
    public function execute(int $userId, string $id): void {
        Notification::where("user_id", $userId)
            ->where("id", $id)
            ->whereNull("read_at")
            ->update(["read_at" => now()]);
    }
}
class MarkAllNotificationsReadAction {
    public function execute(int $userId): void {
        Notification::where("user_id", $userId)->whereNull("read_at")->update(["read_at" => now()]);
    }
}
class GetNotificationPreferencesAction {
    public function execute(int $userId): NotificationPreference {
        return NotificationPreference::firstOrCreate(
            ["user_id" => $userId],
            ["in_app" => true, "email" => true, "push" => true]
        );
    }
}
class UpdateNotificationPreferencesAction {
    public function execute(int $userId, array $data): NotificationPreference {
        return NotificationPreference::updateOrCreate(["user_id" => $userId], $data);
    }
}'

# --- CHAT ACTIONS ---
Set-Content -Path "$actionsDir\ChatActions.php" -Value '<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\Chat\Models\ChatMessage;
use App\Domains\Core\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class GetChatConversationsAction {
    public function execute(User $user): Collection {
        $userId = $user->id;
        $partnerIds = ChatMessage::where("sender_id", $userId)
            ->orWhere("receiver_id", $userId)
            ->selectRaw("CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id", [$userId])
            ->pluck("partner_id")
            ->unique()
            ->toArray();
            
        if ($user->isStudent()) {
            $teacherIds = DB::table("enrollments")
                ->join("batches", "enrollments.batch_id", "=", "batches.id")
                ->where("enrollments.user_id", $userId)
                ->whereNotNull("batches.teacher_id")
                ->pluck("batches.teacher_id")
                ->unique()
                ->toArray();
            $partnerIds = array_unique(array_merge($partnerIds, $teacherIds));
        }
        
        if (empty($partnerIds)) return collect([]);
        
        $partners = User::whereIn("id", $partnerIds)->select("id", "first_name", "last_name", "avatar", "role")->get();
        
        return $partners->map(function($partner) use ($userId) {
            $lastMessage = ChatMessage::where(function($q) use ($userId, $partner) {
                    $q->where("sender_id", $userId)->where("receiver_id", $partner->id);
                })
                ->orWhere(function($q) use ($userId, $partner) {
                    $q->where("sender_id", $partner->id)->where("receiver_id", $userId);
                })
                ->orderBy("created_at", "desc")
                ->first();
            $unreadCount = ChatMessage::where("sender_id", $partner->id)
                ->where("receiver_id", $userId)
                ->where("read", false)
                ->count();
            return [
                "partner" => $partner,
                "last_message" => $lastMessage,
                "unread_count" => $unreadCount
            ];
        })->sortByDesc(function($conv) {
            return $conv["last_message"] ? $conv["last_message"]->created_at : "1970-01-01";
        })->values();
    }
}
class GetChatThreadAction {
    public function execute(int $userId, int $partnerId): LengthAwarePaginator {
        return ChatMessage::where(function($q) use ($userId, $partnerId) {
                $q->where("sender_id", $userId)->where("receiver_id", $partnerId);
            })
            ->orWhere(function($q) use ($userId, $partnerId) {
                $q->where("sender_id", $partnerId)->where("receiver_id", $userId);
            })
            ->orderBy("created_at", "desc")
            ->paginate(50);
    }
}
class SendChatMessageAction {
    public function execute(int $senderId, int $receiverId, array $data): ChatMessage {
        return ChatMessage::create([
            "sender_id" => $senderId,
            "receiver_id" => $receiverId,
            "message" => $data["message"],
            "attachment_url" => $data["attachment_url"] ?? null,
            "read" => false
        ]);
    }
}
class MarkChatReadAction {
    public function execute(int $userId, int $partnerId): void {
        ChatMessage::where("sender_id", $partnerId)
            ->where("receiver_id", $userId)
            ->where("read", false)
            ->update(["read" => true]);
    }
}'

Write-Host "Notification and Chat domain generated"
