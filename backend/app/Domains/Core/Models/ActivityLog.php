<?php

namespace App\Domains\Core\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'event', 'description', 'ip_address', 'user_agent', 'properties'];
    protected $casts    = ['properties' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log an activity event.
     */
    public static function record(string $event, string $description = '', array $properties = []): void
    {
        $request = request();
        $user = auth()->user();
        
        $userAgent = $request->userAgent();
        $browser = 'Unknown';
        $device = 'Unknown';
        
        if ($userAgent) {
            if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i', $userAgent)) {
                $device = 'Tablet';
            } elseif (preg_match('/Mobile|Phone|iPhone|iPod/i', $userAgent)) {
                $device = 'Mobile';
            } else {
                $device = 'Desktop';
            }
            
            if (preg_match('/MSIE/i', $userAgent) && !preg_match('/Opera/i', $userAgent)) {
                $browser = 'Internet Explorer';
            } elseif (preg_match('/Firefox/i', $userAgent)) {
                $browser = 'Firefox';
            } elseif (preg_match('/Chrome/i', $userAgent)) {
                $browser = 'Chrome';
            } elseif (preg_match('/Safari/i', $userAgent)) {
                $browser = 'Safari';
            } elseif (preg_match('/Opera/i', $userAgent)) {
                $browser = 'Opera';
            } elseif (preg_match('/Netscape/i', $userAgent)) {
                $browser = 'Netscape';
            }
        }

        $logProperties = array_merge([
            'actor_role'  => $user?->role ?? 'Guest',
            'request_id'  => (string) \Illuminate\Support\Str::uuid(),
            'route'       => $request->path(),
            'http_method' => $request->method(),
            'browser'     => $browser,
            'device'      => $device,
        ], $properties);

        $userId = $user?->id ?? auth()->id() ?? auth('sanctum')->id();
        if (!$userId) {
            $userId = User::where('role', 'admin')->value('id') ?? 1;
        }

        static::create([
            'user_id'     => $userId,
            'event'       => $event,
            'description' => $description,
            'ip_address'  => $request->ip(),
            'user_agent'  => $userAgent,
            'properties'  => $logProperties,
        ]);
    }
}
