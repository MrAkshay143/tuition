<?php

namespace Tests\Feature;

use App\Domains\LiveClass\Models\LiveClass;
use Tests\TestCase;

class LiveClassApiTest extends TestCase
{
    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }

    public function test_live_class_model_instantiation(): void
    {
        $liveClass = new LiveClass();
        $liveClass->title = 'Physics Mechanics Live';
        $liveClass->provider = 'zoom';
        $liveClass->status = 'scheduled';

        $this->assertEquals('Physics Mechanics Live', $liveClass->title);
        $this->assertEquals('zoom', $liveClass->provider);
        $this->assertEquals('scheduled', $liveClass->status);
    }
}
