<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');

        // Sanctum stateless API token authentication
        // $middleware->statefulApi();

        // Middleware aliases
        $middleware->alias([
            'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \App\Http\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'active'     => \App\Http\Middleware\EnsureUserIsActive::class,
        ]);

        // Append middleware to API route group
        $middleware->appendToGroup('api', [
            \App\Http\Middleware\UpdateLastActive::class,
            \App\Http\Middleware\SecurityHeadersMiddleware::class,
            \App\Http\Middleware\ApiVersionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Return JSON for all API exceptions
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                if ($e instanceof \Illuminate\Auth\AuthenticationException ||
                    ($e instanceof \InvalidArgumentException && str_contains($e->getMessage(), 'Route [login] not defined'))) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthenticated. Please log in.',
                        'data'    => null,
                        'meta'    => null,
                        'errors'  => 'Unauthorized',
                    ], 401);
                }
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed.',
                        'data'    => null,
                        'meta'    => null,
                        'errors'  => $e->errors(),
                    ], 422);
                }
                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Resource not found.',
                        'data'    => null,
                        'meta'    => null,
                        'errors'  => 'NotFound',
                    ], 404);
                }
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    return response()->json([
                        'success' => false,
                        'message' => $e->getMessage() ?: 'HTTP Error',
                        'data'    => null,
                        'meta'    => null,
                        'errors'  => 'HttpException',
                    ], $e->getStatusCode());
                }
                if ($e instanceof \DomainException) {
                    return response()->json([
                        'success' => false,
                        'message' => $e->getMessage(),
                        'data'    => null,
                        'meta'    => null,
                        'errors'  => 'DomainException',
                    ], 422);
                }
                if (config('app.debug')) {
                    return response()->json([
                        'success' => false,
                        'message' => $e->getMessage(),
                        'data'    => null,
                        'meta'    => [
                            'file' => $e->getFile(),
                            'line' => $e->getLine(),
                        ],
                        'errors'  => $e->getTraceAsString(),
                    ], 500);
                }
                return response()->json([
                    'success' => false,
                    'message' => 'Server error. Please try again.',
                    'data'    => null,
                    'meta'    => null,
                    'errors'  => 'ServerError',
                ], 500);
            }
        });
    })->create();
