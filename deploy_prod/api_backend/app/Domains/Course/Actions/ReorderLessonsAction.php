<?php

namespace App\Domains\Course\Actions;

use App\Domains\Course\Models\Lesson;
use Illuminate\Support\Facades\DB;

class ReorderLessonsAction
{
    /**
     * Reorder lessons, possibly shifting them across chapters.
     * $lessonsData is an array of ['id' => X, 'chapter_id' => Y, 'sort_order' => Z]
     */
    public function execute(array $lessonsData): void
    {
        DB::transaction(function () use ($lessonsData) {
            foreach ($lessonsData as $item) {
                Lesson::where('id', $item['id'])->update([
                    'chapter_id'  => $item['chapter_id'],
                    'sort_order' => $item['sort_order']
                ]);
            }
        });
    }
}
