<?php

namespace App\Support\Traits;

use Illuminate\Support\Facades\Schema;

trait HasAuditColumns
{
    protected static function bootHasAuditColumns()
    {
        static::creating(function ($model) {
            if (auth()->check() && Schema::hasColumn($model->getTable(), 'created_by')) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function ($model) {
            if (auth()->check() && Schema::hasColumn($model->getTable(), 'updated_by')) {
                $model->updated_by = auth()->id();
            }
        });

        if (method_exists(static::class, 'bootSoftDeletes')) {
            static::deleting(function ($model) {
                if (auth()->check() && Schema::hasColumn($model->getTable(), 'deleted_by')) {
                    $model->deleted_by = auth()->id();
                    $model->save();
                }
            });
        }
    }
}
