<?php

namespace App\Domains\Core\Services;

use App\Domains\Core\Models\UserSession;

class ImpossibleTravelService
{
    /**
     * Calculate travel speed in km/h between two request locations.
     * Geolocation delta adds to risk score rather than blocking strictly.
     */
    public function calculateSpeedKmH(UserSession $session, ?float $newLat, ?float $newLng): float
    {
        if (!$session->latitude || !$session->longitude || !$newLat || !$newLng) {
            return 0.0;
        }

        if (!$session->last_activity_at) {
            return 0.0;
        }

        $hours = max(0.001, now()->diffInSeconds($session->last_activity_at) / 3600.0);
        $distanceKm = $this->haversineGreatCircleDistance($session->latitude, $session->longitude, $newLat, $newLng);

        return round($distanceKm / $hours, 2);
    }

    private function haversineGreatCircleDistance(float $latitudeFrom, float $longitudeFrom, float $latitudeTo, float $longitudeTo, float $earthRadius = 6371): float
    {
        $latFrom = deg2rad($latitudeFrom);
        $lonFrom = deg2rad($longitudeFrom);
        $latTo = deg2rad($latitudeTo);
        $lonTo = deg2rad($longitudeTo);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
        return $angle * $earthRadius;
    }
}
