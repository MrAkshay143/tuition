<?php

namespace App\Support\Telemetry;

use Illuminate\Support\Facades\Log;

class PerformanceTelemetry
{
    public static function measure(string $name, callable $callback)
    {
        $start = microtime(true);
        $result = $callback();
        $durationMs = round((microtime(true) - $start) * 1000, 2);

        Log::info("[Telemetry:Performance] {$name} executed in {$durationMs}ms");

        return $result;
    }
}
