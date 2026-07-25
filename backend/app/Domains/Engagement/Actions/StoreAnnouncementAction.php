<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\Core\Models\Announcement;
class StoreAnnouncementAction {
    public function execute(array $data, int $userId): Announcement {
        $announcement = Announcement::create([
            'created_by' => $userId,
            'title' => $data['title'],
            'body' => $data['body'],
            'type' => $data['type'],
            'is_all' => $data['is_all'] ?? false,
            'channels' => $data['channels'] ?? ['platform'],
            'sent_at' => now()
        ]);

        if (!($data['is_all'] ?? false) && !empty($data['batch_ids'])) {
            $announcement->batches()->sync($data['batch_ids']);
        }

        return $announcement;
    }
}
