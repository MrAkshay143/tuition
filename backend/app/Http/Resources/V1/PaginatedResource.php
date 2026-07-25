<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class PaginatedResource extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'success' => true,
            'message' => 'Resource collection fetched successfully.',
            'data'    => $this->collection,
            'meta'    => [
                'current_page' => $this->resource->currentPage(),
                'per_page'     => $this->resource->perPage(),
                'total'        => $this->resource->total(),
                'last_page'    => $this->resource->lastPage(),
            ],
            'errors'  => null,
        ];
    }
}
