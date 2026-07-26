<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {

    }

    public function boot(): void
    {
        if (config('app.env') === 'production') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        \Illuminate\Auth\Notifications\ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url')."/login?token={$token}&email={$notifiable->getEmailForPasswordReset()}";
        });

        // Implicitly grant "Super Admin" role all permissions
        // This works in the app by using gate-related functions like auth()->user->can() and @can()
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return $user->hasRole('admin') ? true : null;
        });

        \Illuminate\Support\Facades\Gate::policy(
            \App\Domains\Course\Models\Course::class,
            \App\Domains\Course\Policies\CoursePolicy::class
        );
        \Illuminate\Support\Facades\Gate::policy(
            \App\Domains\LiveClass\Models\LiveClass::class,
            \App\Domains\LiveClass\Policies\LiveClassPolicy::class
        );
        \Illuminate\Support\Facades\Gate::policy(
            \App\Domains\Core\Models\User::class,
            \App\Domains\Core\Policies\StudentPolicy::class
        );
        \Illuminate\Support\Facades\Gate::policy(
            \App\Domains\Academic\Models\EducationType::class,
            \App\Domains\Academic\Policies\EducationTypePolicy::class
        );
        \Illuminate\Support\Facades\Gate::policy(
            \App\Domains\Academic\Models\AcademicSession::class,
            \App\Domains\Academic\Policies\AcademicSessionPolicy::class
        );
        \Illuminate\Support\Facades\Gate::policy(
            \App\Domains\Academic\Models\Program::class,
            \App\Domains\Academic\Policies\ProgramPolicy::class
        );
        \Illuminate\Support\Facades\Gate::policy(
            \App\Domains\Academic\Models\Subject::class,
            \App\Domains\Academic\Policies\SubjectPolicy::class
        );
        \Illuminate\Support\Facades\Gate::policy(
            \App\Domains\Chat\Models\ChatConversation::class,
            \App\Domains\Chat\Policies\ChatConversationPolicy::class
        );

        RateLimiter::for('auth-login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('auth-forgot-password', function (Request $request) {
            return Limit::perMinutes(15, 3)->by($request->ip());
        });

        RateLimiter::for('auth-refresh', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('api-search', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('media-upload', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('admin-actions', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('export-download', function (Request $request) {
            return Limit::perMinutes(10, 3)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('backup-restore', function (Request $request) {
            return Limit::perHours(1, 2)->by($request->user()?->id ?: $request->ip());
        });
    }
}

