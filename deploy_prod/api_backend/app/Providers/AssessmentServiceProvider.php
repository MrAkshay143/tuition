<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AssessmentServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(
            \App\Models\Assignment::class,
            \App\Domains\Assessment\Policies\AssignmentPolicy::class
        );
        Gate::policy(
            \App\Models\Exam::class,
            \App\Domains\Assessment\Policies\ExamPolicy::class
        );
        Gate::policy(
            \App\Models\Certificate::class,
            \App\Domains\Certificate\Policies\CertificatePolicy::class
        );
    }
}
