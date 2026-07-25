<?php
namespace App\Domains\Engagement\Requests;

use App\Http\Requests\ApiFormRequest;

class GetDashboardStatsRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [];
    }
}
