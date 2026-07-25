<?php

namespace App\Domains\Core\Contracts;

interface ImportExportInterface
{
    public function export(int $courseId): array;
    public function import(array $packageData): bool;
}
