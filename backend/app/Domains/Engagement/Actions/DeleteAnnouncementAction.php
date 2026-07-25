<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\Core\Models\Announcement;
class DeleteAnnouncementAction {
    public function execute(Announcement $announcement): void {
        $announcement->delete();
    }
}
