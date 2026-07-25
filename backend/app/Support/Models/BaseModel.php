<?php

namespace App\Support\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Support\Traits\HasUuid;
use App\Support\Traits\HasAuditColumns;
use App\Support\Traits\HasOwner;
use App\Support\Traits\ClearsCacheOnSave;

abstract class BaseModel extends Model
{
    use HasFactory, HasUuid, HasAuditColumns, HasOwner, ClearsCacheOnSave;

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
