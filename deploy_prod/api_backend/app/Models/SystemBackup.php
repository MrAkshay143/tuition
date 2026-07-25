<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemBackup extends Model
{
    protected $fillable = [
        'file_name',
        'file_path',
        'size_bytes',
        'type',
        'status',
    ];
}
