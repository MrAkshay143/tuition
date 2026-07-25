<?php

namespace Tests\Feature;

use App\Domains\Media\Models\Media;
use Tests\TestCase;

class MediaLifecycleTest extends TestCase
{
    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }

    public function test_media_model_attributes(): void
    {
        $media = new Media();
        $media->title = 'Sample Video';
        $media->storage_driver = 'r2';

        $this->assertEquals('Sample Video', $media->title);
        $this->assertEquals('r2', $media->storage_driver);
    }
}
