<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class MediaServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(
            \App\Domains\Media\Models\Media::class,
            \App\Domains\Media\Policies\MediaPolicy::class
        );
    }
}
