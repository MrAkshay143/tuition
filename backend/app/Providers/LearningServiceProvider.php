<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class LearningServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(
            \App\Domains\Core\Models\Batch::class,
            \App\Domains\Core\Policies\BatchPolicy::class
        );
    }
}
