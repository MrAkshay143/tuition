<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiVersionMiddleware
{
    /**
     * Handle an incoming request.
     * Extracts version from Accept header: e.g., Accept: application/vnd.eduflow.v1+json
     */
    public function handle(Request $request, Closure $next, $defaultVersion = 'v1')
    {
        $acceptHeader = $request->header('Accept');
        
        $version = $defaultVersion;
        
        if ($acceptHeader && preg_match('/application\/vnd\.eduflow\.(v\d+)\+json/', $acceptHeader, $matches)) {
            $version = $matches[1];
        }

        // Attach the version to the request so controllers/resources can use it
        $request->attributes->set('api_version', $version);
        
        return $next($request);
    }
}
