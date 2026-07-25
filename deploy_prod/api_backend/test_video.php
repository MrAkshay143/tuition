<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::first();
echo "Testing with user: {$user->email}\n";

// create a dummy video file
$dummyVideo = storage_path('app/public/videos/dummy.mp4');
@mkdir(dirname($dummyVideo), 0755, true);
file_put_contents($dummyVideo, 'dummy content');

$media = \App\Domains\Media\Models\Media::create([
    'name' => 'test_video.mp4',
    'original_name' => 'test_video.mp4',
    'provider' => 'local',
    'storage_driver' => 'public',
    'mime' => 'video/mp4',
    'extension' => 'mp4',
    'size' => 1024,
    'size_bytes' => 1024,
    'path' => 'videos/dummy.mp4',
    'filename' => 'test_video.mp4',
    'mime_type' => 'video/mp4',
    'uploaded_by' => $user->id,
    'processing_status' => 'queued',
    'visibility' => 'private',
    'checksum' => md5('dummy content'),
]);

echo "Created media ID: {$media->id}\n";

$pipeline = app(\App\Domains\Media\Services\VideoPipelineService::class);
$video = $pipeline->process($media);

echo "Dispatched pipeline, resulting video ID: {$video->id}\n";
echo "Media processing_status should be 'processing': {$media->fresh()->processing_status}\n";
echo "Video status should be 'processing': {$video->fresh()->status}\n";

$jobs = \Illuminate\Support\Facades\DB::table('jobs')->count();
echo "Jobs in queue: $jobs\n";
