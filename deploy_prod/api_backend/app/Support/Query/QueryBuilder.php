<?php

namespace App\Support\Query;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class QueryBuilder
{
    protected Builder $query;
    protected Request $request;

    protected array $allowedIncludes = [];
    protected array $allowedSorts = [];
    protected array $allowedFilters = [];
    protected array $allowedFields = [];

    protected string $defaultSort = 'id';
    protected string $defaultDirection = 'asc';
    protected int $defaultPerPage = 15;
    protected int $maxPerPage = 100;

    public function __construct(Builder $query, ?Request $request = null)
    {
        $this->query = $query;
        $this->request = $request ?: request();
    }

    public static function for(Builder $query, ?Request $request = null): self
    {
        return new self($query, $request);
    }

    public function allowedIncludes(array $includes): self
    {
        $this->allowedIncludes = $includes;
        return $this;
    }

    public function allowedSorts(array $sorts): self
    {
        $this->allowedSorts = $sorts;
        return $this;
    }

    public function allowedFilters(array $filters): self
    {
        $this->allowedFilters = $filters;
        return $this;
    }

    public function allowedFields(array $fields): self
    {
        $this->allowedFields = $fields;
        return $this;
    }

    public function defaultSort(string $column, string $direction = 'asc'): self
    {
        $this->defaultSort = $column;
        $this->defaultDirection = $direction;
        return $this;
    }

    public function defaultPerPage(int $perPage): self
    {
        $this->defaultPerPage = $perPage;
        return $this;
    }

    public function maxPerPage(int $max): self
    {
        $this->maxPerPage = $max;
        return $this;
    }

    /**
     * Scope query using standard visibleTo helper.
     */
    public function visibleTo($user): self
    {
        if (method_exists($this->query->getModel(), 'scopeVisibleTo')) {
            $this->query->visibleTo($user);
        }
        return $this;
    }

    /**
     * Execute parsing pipelines and return paginated standard envelope.
     */
    public function jsonPaginate()
    {
        // 1. Field Selection
        FieldParser::apply($this->query, $this->request->query('fields'), $this->allowedFields);

        // 2. Relation Inclusion
        IncludeParser::apply($this->query, $this->request->query('include'), $this->allowedIncludes);

        // 3. Filtering
        FilterParser::apply($this->query, $this->request->query('filter'), $this->allowedFilters);

        // 4. Searching (Wildcard query parameters)
        $search = $this->request->query('search');
        if (!empty($search)) {
            $searchColumns = array_filter($this->allowedSorts, fn($col) => $col !== 'id');
            $this->query->where(function (Builder $q) use ($search, $searchColumns) {
                foreach ($searchColumns as $col) {
                    $q->orWhere($col, 'LIKE', "%{$search}%");
                }
            });
        }

        // 5. Sorting
        $sortCol = $this->request->query('sort', $this->defaultSort);
        $sortDir = $this->request->query('direction', $this->defaultDirection);
        SortParser::apply($this->query, $sortCol, $sortDir, $this->allowedSorts, $this->defaultSort);

        // 6. Pagination
        $perPage = (int) $this->request->query('per_page', $this->defaultPerPage);
        if ($perPage > $this->maxPerPage) {
            throw ValidationException::withMessages([
                'per_page' => ["The per_page value cannot exceed {$this->maxPerPage}."]
            ]);
        }

        $paginator = $this->query->paginate($perPage);

        return $paginator;
    }
}
