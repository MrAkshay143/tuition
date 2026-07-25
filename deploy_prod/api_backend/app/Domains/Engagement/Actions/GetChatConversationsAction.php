<?php

namespace App\Domains\Engagement\Actions;

use App\Domains\Chat\Models\ChatMessage;
use App\Domains\Core\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GetChatConversationsAction
{
    public function execute(User $user): Collection
    {
        $userId = $user->id;
        $partnerIds = ChatMessage::where("sender_id", $userId)
            ->orWhere("receiver_id", $userId)
            ->selectRaw("CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id", [$userId])
            ->pluck("partner_id")
            ->unique()
            ->toArray();

        if ($user->isStudent()) {
            $teacherIds = DB::table("batch_student")
                ->join("batches", "batch_student.batch_id", "=", "batches.id")
                ->where("batch_student.student_id", $userId)
                ->whereNotNull("batches.teacher_id")
                ->pluck("batches.teacher_id")
                ->unique()
                ->toArray();
            $partnerIds = array_unique(array_merge($partnerIds, $teacherIds));
        }

        if (empty($partnerIds)) return collect([]);

        $partners = User::whereIn("id", $partnerIds)->select("id", "name", "email", "avatar", "role")->get();

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
                ->where(function($q) {
                    $q->where("read", false)->orWhereNull("read_at");
                })
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
