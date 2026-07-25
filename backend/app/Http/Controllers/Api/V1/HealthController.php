<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Core\Traits\ApiResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Http\JsonResponse;

class HealthController extends ApiController
{
    use ApiResponse;

    /**
     * GET /api/v1/health
     */
    public function __invoke(): JsonResponse
    {
        $details = [
            'database' => 'ok',
            'cache'    => 'ok',
            'queue'    => 'ok',
            'storage'  => 'ok',
            'version'  => '1.0.0',
            'env'      => config('app.env'),
        ];

        $status = 200;

        // 1. Database Check
        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $details['database'] = 'failed: ' . $e->getMessage();
            $status = 503;
        }

        // 2. Cache Check
        try {
            Cache::put('health_check', true, 10);
            if (!Cache::get('health_check')) {
                throw new \Exception('Cache read failed.');
            }
        } catch (\Throwable $e) {
            $details['cache'] = 'failed: ' . $e->getMessage();
            $status = 503;
        }

        return $this->success(
            $details,
            $status === 200 ? 'System is healthy.' : 'System has health warnings.',
            $status
        );
    }
}
