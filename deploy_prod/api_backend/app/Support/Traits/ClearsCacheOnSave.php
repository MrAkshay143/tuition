<?php

namespace App\Support\Traits;

use Illuminate\Support\Facades\Cache;

trait ClearsCacheOnSave
{
    protected static function bootClearsCacheOnSave()
    {
        $clear = function ($model) {
            $tag = strtolower(class_basename($model));
            try {
                if (Cache::supportsTags()) {
                    Cache::tags([$tag, 'academic'])->flush();
                } else {
                    Cache::forget("{$tag}_all");
                }
            } catch (\Throwable $e) {
                // Ignore if cache driver does not support tags
            }
        };

        static::saved($clear);
        static::deleted($clear);
    }
}
