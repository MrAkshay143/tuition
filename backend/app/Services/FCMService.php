<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Domains\Core\Models\User;
use Illuminate\Support\Facades\DB;

class FCMService
{
    public function sendSilentPush(int $userId, array $data)
    {
        // 1. Get user FCM tokens from users table
        $tokens = DB::table('users')
            ->where('id', $userId)
            ->whereNotNull('fcm_token')
            ->pluck('fcm_token')
            ->toArray();

        if (empty($tokens)) {
            return false;
        }

        // 2. Fetch Firebase credentials from settings
        $settings = DB::table('settings')->whereIn('key', ['fcm_project_id', 'fcm_service_account_media_id'])->pluck('value', 'key');
        
        $projectId = $settings['fcm_project_id'] ?? null;
        $mediaId = $settings['fcm_service_account_media_id'] ?? null;
        
        if (!$projectId || !$mediaId) {
            \Log::warning('FCM credentials missing in settings');
            return false;
        }
        
        // In a real implementation, we would generate a Google OAuth2 access token using the Service Account JSON
        // stored in the Media Library. Since this is a placeholder implementation for the architecture plan,
        // we'll simulate the HTTP call.
        
        /*
        $media = \App\Domains\Media\Models\Media::find($mediaId);
        $jsonContent = \Illuminate\Support\Facades\Storage::disk($media->disk)->get($media->path);
        // ... Generate OAuth2 Token using google/auth ...
        */
        
        $accessToken = "mock_token"; 

        // 3. Send via FCM HTTP v1 API
        foreach ($tokens as $token) {
            Http::withToken($accessToken)
                ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                    'message' => [
                        'token' => $token,
                        'data'  => $data // silent data push
                    ]
                ]);
        }
        
        return true;
    }
}
