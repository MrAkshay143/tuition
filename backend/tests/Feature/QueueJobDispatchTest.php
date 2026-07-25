<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Queue;
use App\Domains\Media\Jobs\ProcessVideoHlsJob;
use App\Domains\Media\Models\Media;
use Tests\TestCase;

class QueueJobDispatchTest extends TestCase
{
    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }

    public function test_async_hls_job_can_be_dispatched(): void
    {
        Queue::fake();

        $media = new Media(['id' => 101, 'path' => 'raw/sample.mp4']);
        ProcessVideoHlsJob::dispatch($media);

        Queue::assertPushed(ProcessVideoHlsJob::class);
    }
}
