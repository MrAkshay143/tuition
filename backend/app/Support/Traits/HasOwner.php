<?php

namespace App\Support\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

trait HasOwner
{
    public function owner()
    {
        $ownerKey = $this->getOwnerKey();
        return $this->belongsTo(\App\Domains\Core\Models\User::class, $ownerKey);
    }

    public function ownerId(): ?int
    {
        $ownerKey = $this->getOwnerKey();
        return $this->{$ownerKey};
    }

    public function isOwnedBy(\App\Domains\Core\Models\User $user): bool
    {
        return $this->ownerId() === $user->id;
    }

    public function scopeVisibleTo(Builder $query, \App\Domains\Core\Models\User $user): Builder
    {
        if ($user->role === 'admin') {
            return $query;
        }

        if ($user->role === 'teacher') {
            return $query->where($this->getOwnerKey(), $user->id);
        }

        // Student visibility logic fallback
        $class = class_basename($this);
        if ($class === 'Course') {
            return $query->where('status', 'published');
        }

        if ($class === 'Batch') {
            return $query->whereHas('students', fn($q) => $q->where('users.id', $user->id));
        }

        return $query;
    }

    public function scopeManageableBy(Builder $query, \App\Domains\Core\Models\User $user): Builder
    {
        if ($user->role === 'admin') {
            return $query;
        }

        if ($user->role === 'teacher') {
            return $query->where($this->getOwnerKey(), $user->id);
        }

        return $query->whereRaw('1=0');
    }

    protected function getOwnerKey(): string
    {
        if (Schema::hasColumn($this->getTable(), 'uploaded_by')) {
            return 'uploaded_by';
        }
        return 'teacher_id';
    }
}
