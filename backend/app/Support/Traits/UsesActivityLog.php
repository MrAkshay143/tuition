<?php

namespace App\Support\Traits;

trait UsesActivityLog
{
    protected static array $oldValuesLog = [];

    protected static function bootUsesActivityLog()
    {
        static::created(function ($model) {
            $class = class_basename($model);
            $name = $model->name ?? $model->title ?? "ID: {$model->id}";
            \App\Models\ActivityLog::record('created', "Created {$class}: {$name}");
        });

        static::updating(function ($model) {
            $changes = $model->getDirty();
            unset($changes['updated_at']);
            
            $oldValues = [];
            foreach (array_keys($changes) as $key) {
                $oldValues[$key] = $model->getOriginal($key);
            }
            
            static::$oldValuesLog[spl_object_id($model)] = $oldValues;
        });

        static::updated(function ($model) {
            $class = class_basename($model);
            $name = $model->name ?? $model->title ?? "ID: {$model->id}";
            
            $newValues = $model->getChanges();
            unset($newValues['updated_at']);
            $id = spl_object_id($model);
            $oldValues = static::$oldValuesLog[$id] ?? [];
            unset(static::$oldValuesLog[$id]);

            \App\Models\ActivityLog::record('updated', "Updated {$class}: {$name}", [
                'old_values' => $oldValues,
                'new_values' => $newValues,
            ]);
        });

        static::deleted(function ($model) {
            $class = class_basename($model);
            $name = $model->name ?? $model->title ?? "ID: {$model->id}";
            \App\Models\ActivityLog::record('deleted', "Deleted {$class}: {$name}");
        });
    }
}
