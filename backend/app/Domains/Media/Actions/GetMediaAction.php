<?php
namespace App\Domains\Media\Actions;
use App\Domains\Media\Repositories\MediaRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
class GetMediaAction {
    public function __construct(protected MediaRepository $repo) {}
    public function execute(array $filters, int $perPage): LengthAwarePaginator {
        return $this->repo->getPaginated($filters, $perPage);
    }
}
