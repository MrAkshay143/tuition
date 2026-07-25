<?php

namespace Tests\Feature;

use Tests\TestCase;

class OperationsTest extends TestCase
{
    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }

    public function test_liveness_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/v1/health/live');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ok',
            ]);
    }
}
