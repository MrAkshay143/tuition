<?php

namespace App\Support\Http;

class ApiResponder
{
    public static function success(mixed $data = null, string $message = 'Success', mixed $meta = null, int $status = 200): ApiResponse
    {
        return new ApiResponse(true, $message, $data, $meta, null, $status);
    }

    public static function error(string $message = 'Error', mixed $errors = null, int $status = 400): ApiResponse
    {
        return new ApiResponse(false, $message, null, null, $errors, $status);
    }
}
