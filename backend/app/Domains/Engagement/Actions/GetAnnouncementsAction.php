<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\Core\Models\User;
use App\Domains\Core\Models\Announcement;
use Illuminate\Support\Facades\DB;
class GetAnnouncementsAction {
    public function execute(?User $user = null) {
        if (!$user) {
            return Announcement::where('is_all', true)->orderBy('created_at', 'desc')->get();
        }
        if ($user->isAdmin()) {
            return Announcement::orderBy('created_at', 'desc')->get();
        }
        if ($user->isTeacher()) {
            return Announcement::where('created_by', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }
        
        $studentBatchIds = DB::table('batch_student')->where('student_id', $user->id)->pluck('batch_id')->toArray();
        
        $announcements = Announcement::where('is_all', true)->get();
        
        $batchAnnouncements = Announcement::where('is_all', false)
            ->whereHas('batches', function ($query) use ($studentBatchIds) {
                $query->whereIn('batches.id', $studentBatchIds);
            })
            ->get();
            
        return $announcements->concat($batchAnnouncements)
            ->sortByDesc('created_at')
            ->values();
    }
}
