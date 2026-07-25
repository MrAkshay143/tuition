<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class CourseServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(
            \App\Domains\Course\Models\Course::class,
            \App\Domains\Course\Policies\CoursePolicy::class
        );
        Gate::policy(
            \App\Domains\Course\Models\Lesson::class,
            \App\Domains\Course\Policies\LessonPolicy::class
        );
    }
}
