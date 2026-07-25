<?php

namespace App\Domains\Core\Services;

class FingerprintScorer
{
    /**
     * Compute weighted fuzzy fingerprint match score percentage.
     * Weights:
     * - Browser Family & Major Version: 40%
     * - Operating System: 20%
     * - Platform: 10%
     * - Timezone: 10%
     * - Language: 5%
     * - Screen Resolution: 5%
     * - Touch Support: 5%
     * - Hardware Concurrency / CPU: 5%
     */
    public function calculateScore(array $stored, array $incoming): int
    {
        $score = 0;

        // Browser (40)
        if (!empty($stored['browser']) && !empty($incoming['browser']) && strtolower($stored['browser']) === strtolower($incoming['browser'])) {
            $score += 25;
            if (!empty($stored['browser_version']) && !empty($incoming['browser_version']) && explode('.', $stored['browser_version'])[0] === explode('.', $incoming['browser_version'])[0]) {
                $score += 15;
            }
        } elseif (!empty($stored['user_agent']) && !empty($incoming['user_agent']) && $stored['user_agent'] === $incoming['user_agent']) {
            $score += 40;
        }

        // OS (20)
        if (!empty($stored['operating_system']) && !empty($incoming['operating_system']) && strtolower($stored['operating_system']) === strtolower($incoming['operating_system'])) {
            $score += 20;
        }

        // Platform (10)
        if (!empty($stored['platform']) && !empty($incoming['platform']) && strtolower($stored['platform']) === strtolower($incoming['platform'])) {
            $score += 10;
        }

        // Timezone (10)
        if (!empty($stored['timezone']) && !empty($incoming['timezone']) && $stored['timezone'] === $incoming['timezone']) {
            $score += 10;
        }

        // Language (5)
        if (!empty($stored['language']) && !empty($incoming['language']) && strtolower(substr($stored['language'], 0, 2)) === strtolower(substr($incoming['language'], 0, 2))) {
            $score += 5;
        }

        // Resolution (5)
        if (!empty($stored['resolution']) && !empty($incoming['resolution']) && $stored['resolution'] === $incoming['resolution']) {
            $score += 5;
        }

        // Touch (5)
        if (isset($stored['touch']) && isset($incoming['touch']) && (bool)$stored['touch'] === (bool)$incoming['touch']) {
            $score += 5;
        }

        // Hardware Concurrency (5)
        if (!empty($stored['cores']) && !empty($incoming['cores']) && (int)$stored['cores'] === (int)$incoming['cores']) {
            $score += 5;
        }

        return $score;
    }

    public function isAcceptable(int $score, int $threshold = 70): bool
    {
        return $score >= $threshold;
    }
}
