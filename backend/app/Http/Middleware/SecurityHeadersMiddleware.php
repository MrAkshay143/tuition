<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $config = config('security');

        if ($config['hsts'] ?? true) {
            $maxAge = $config['hsts_max_age'] ?? 31536000;
            $response->headers->set('Strict-Transport-Security', "max-age={$maxAge}; includeSubDomains");
        }

        $response->headers->set('X-Frame-Options', $config['frame_options'] ?? 'DENY');
        $response->headers->set('X-Content-Type-Options', $config['content_type_options'] ?? 'nosniff');
        $response->headers->set('Referrer-Policy', $config['referrer_policy'] ?? 'strict-origin-when-cross-origin');
        $response->headers->set('Cross-Origin-Opener-Policy', $config['cross_origin_opener_policy'] ?? 'same-origin');
        $response->headers->set('Cross-Origin-Resource-Policy', $config['cross_origin_resource_policy'] ?? 'same-origin');
        $response->headers->set('Origin-Agent-Cluster', $config['origin_agent_cluster'] ?? '?1');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', $config['permitted_cross_domain'] ?? 'none');

        if (!empty($config['csp'])) {
            $response->headers->set('Content-Security-Policy', $config['csp']);
        }

        return $response;
    }
}
