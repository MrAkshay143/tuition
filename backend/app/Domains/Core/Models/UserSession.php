<?php

namespace App\Domains\Core\Models;

use App\Support\Models\BaseModel;
use App\Domains\Core\Enums\UserSessionStatus;
use Illuminate\Database\Eloquent\Builder;

class UserSession extends BaseModel
{
    protected $fillable = [
        'uuid', 'user_id', 'session_hash', 'device_id', 'device_name', 'device_type',
        'login_source', 'browser', 'browser_version', 'operating_system', 'os_version',
        'platform', 'fingerprint_hash', 'user_agent', 'ip_address', 'last_activity_ip',
        'country', 'city', 'latitude', 'longitude', 'status', 'risk_score', 'risk_level',
        'failed_validation_count', 'device_priority', 'request_count', 'is_trusted',
        'trusted_until', 'remember_device_until', 'refresh_token_hash', 'login_at',
        'logout_at', 'last_activity_at', 'last_request_at', 'last_validation_at',
        'expires_at', 'absolute_expires_at', 'revoked_at'
    ];

    protected $casts = [
        'status'                 => UserSessionStatus::class,
        'is_trusted'             => 'boolean',
        'trusted_until'          => 'datetime',
        'remember_device_until'  => 'datetime',
        'login_at'               => 'datetime',
        'logout_at'              => 'datetime',
        'last_activity_at'       => 'datetime',
        'last_request_at'        => 'datetime',
        'last_validation_at'     => 'datetime',
        'expires_at'             => 'datetime',
        'absolute_expires_at'    => 'datetime',
        'revoked_at'             => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', UserSessionStatus::ACTIVE->value)
                     ->where(function ($q) {
                         $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                     })
                     ->where(function ($q) {
                         $q->whereNull('absolute_expires_at')->orWhere('absolute_expires_at', '>', now());
                     });
    }

    public function scopeRevoked(Builder $query): Builder
    {
        return $query->where('status', UserSessionStatus::REVOKED->value);
    }

    public function isExpired(): bool
    {
        if ($this->status === UserSessionStatus::EXPIRED) return true;
        if ($this->expires_at && $this->expires_at->isPast()) return true;
        if ($this->absolute_expires_at && $this->absolute_expires_at->isPast()) return true;
        return false;
    }
}
