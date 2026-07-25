<?php

namespace App\Support\Telemetry;

use Illuminate\Support\Facades\Log;

class MetricsTelemetry
{
    public static function increment(string $metric, int $count = 1, array $tags = []): void
    {
        Log::info("[Telemetry:Metric] {$metric} +{$count}", $tags);
    }
}
