<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Services\FCMService;

class ChatSignalingController extends ApiController
{
    public function postSignal(Request $request, FCMService $fcm)
    {
        $validated = $request->validate([
            'partner_id' => 'required|integer',
            'type'       => 'required|in:offer,answer,ice',
            'payload'    => 'required|array'
        ]);

        $senderId = $request->user()->id;
        $partnerId = $validated['partner_id'];
        
        \Illuminate\Support\Facades\Gate::authorize('message', [\App\Domains\Chat\Models\ChatConversation::class, (int)$partnerId]);
        
        $key = "webrtc_signals:{$partnerId}";
        
        $signals = Cache::get($key, []);
        $signals[] = [
            'sender_id' => $senderId,
            'type'      => $validated['type'],
            'payload'   => $validated['payload'],
            'timestamp' => now()->timestamp
        ];
        
        Cache::put($key, $signals, now()->addMinutes(2));
        
        // Notify the partner to wake up and fetch signals
        $fcm->sendSilentPush($partnerId, [
            'type' => 'incoming_webrtc',
            'partner_id' => $senderId
        ]);

        return $this->success(null, 'Signal posted');
    }

    public function postSignalPartner(Request $request, \App\Services\FCMService $fcm, $partnerId)
    {
        $type = $request->input('type');
        if ($type === 'candidate') {
            $type = 'ice';
        }

        $payload = $request->except(['type', 'partner_id']);
        $request->merge([
            'partner_id' => $partnerId,
            'type' => $type,
            'payload' => $payload
        ]);

        return $this->postSignal($request, $fcm);
    }

    public function getSignals(Request $request)
    {
        $userId = $request->user()->id;
        $key = "webrtc_signals:{$userId}";
        
        $signals = Cache::pull($key, []); // pull removes it after fetching
        
        return $this->success($signals, 'Signals retrieved');
    }

    public function getConfig()
    {
        $settings = \Illuminate\Support\Facades\DB::table('settings')
            ->whereIn('key', ['webrtc_enabled', 'stun_urls', 'turn_urls', 'turn_username', 'turn_password'])
            ->pluck('value', 'key');
            
        $enabled = ($settings['webrtc_enabled'] ?? 'true') === 'true';
        $stunUrls = array_filter(array_map('trim', explode(',', $settings['stun_urls'] ?? 'stun:stun.l.google.com:19302')));
        $turnUrls = array_filter(array_map('trim', explode(',', $settings['turn_urls'] ?? '')));
        
        $iceServers = [];
        if (!empty($stunUrls)) {
            $iceServers[] = ['urls' => $stunUrls];
        }
        
        if (!empty($turnUrls)) {
            $turnServer = ['urls' => $turnUrls];
            if (!empty($settings['turn_username'])) {
                $turnServer['username'] = $settings['turn_username'];
            }
            if (!empty($settings['turn_password'])) {
                $turnServer['credential'] = $settings['turn_password'];
            }
            $iceServers[] = $turnServer;
        }

        return response()->json([
            'enabled' => $enabled,
            'iceServers' => $iceServers
        ]);
    }
}
