<?php
namespace App\Domains\Engagement\Actions;
use App\Domains\LiveClass\Models\LiveClass;
use Illuminate\Support\Facades\DB;
class DeleteLiveClassAction {
    public function execute(LiveClass $liveClass): void {
        DB::transaction(function() use ($liveClass) {
            $liveClass->batches()->detach();
            $liveClass->delete();
        });
    }
}
