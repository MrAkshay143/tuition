<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use App\Domains\Core\Traits\ApiResponse;

abstract class ApiController extends BaseController
{
    use AuthorizesRequests, ValidatesRequests, ApiResponse;
}
