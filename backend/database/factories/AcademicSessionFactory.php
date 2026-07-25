<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Domains\Academic\Models\AcademicSession;

class AcademicSessionFactory extends Factory
{
    protected $model = AcademicSession::class;

    public function definition(): array
    {
        $startYear = $this->faker->unique()->numberBetween(2023, 2030);
        $endYear = $startYear + 1;
        $name = "{$startYear}-{$endYear}";

        return [
            'name' => $name,
            'start_date' => "{$startYear}-04-01",
            'end_date' => "{$endYear}-03-31",
            'is_current' => false,
            'is_active' => true,
        ];
    }
}
