<?php

namespace App\Domains\Settings\Services;

use App\Domains\Settings\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FeatureFlagService
{
    /**
     * Check if a feature flag is active.
     */
    public static function isEnabled(string $feature, bool $default = false): bool
    {
        if (Schema::hasTable('feature_flags')) {
            $flag = DB::table('feature_flags')->where('key', $feature)->first();
            if ($flag) {
                return (bool)$flag->is_enabled;
            }
        }

        $key = "feature_{$feature}";
        $val = Setting::get($key);
        if ($val === null) {
            return $default;
        }
        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Enable or disable a feature flag.
     */
    public static function setEnabled(string $feature, bool $enabled): void
    {
        if (Schema::hasTable('feature_flags')) {
            DB::table('feature_flags')->updateOrInsert(
                ['key' => $feature],
                ['name' => ucfirst($feature), 'is_enabled' => $enabled, 'updated_at' => now()]
            );
        }

        $key = "feature_{$feature}";
        Setting::set($key, $enabled ? 'true' : 'false');
    }

    /**
     * Get all feature flags status.
     */
    public static function allFlags(): array
    {
        $flags = [];

        if (Schema::hasTable('feature_flags')) {
            $dbFlags = DB::table('feature_flags')->get();
            foreach ($dbFlags as $f) {
                $flags[$f->key] = (bool)$f->is_enabled;
            }
        }

        $all = Setting::allKeyed();
        foreach ($all as $k => $v) {
            if (str_starts_with($k, 'feature_')) {
                $name = str_replace('feature_', '', $k);
                if (!isset($flags[$name])) {
                    $flags[$name] = filter_var($v, FILTER_VALIDATE_BOOLEAN);
                }
            }
        }

        return $flags;
    }
}
