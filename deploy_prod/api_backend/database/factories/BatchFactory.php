<?php

namespace Database\Factories;

use App\Domains\Core\Models\Batch;
use App\Domains\Academic\Models\Program;
use App\Domains\Academic\Models\AcademicSession;
use Illuminate\Database\Eloquent\Factories\Factory;

class BatchFactory extends Factory
{
    protected $model = Batch::class;

    public function definition(): array
    {
        $colors = ['#6c63ff', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
        return [
            'name'        => $this->faker->words(3, true) . ' Batch',
            'description' => $this->faker->sentence(),
            'color'       => $this->faker->randomElement($colors),
            'is_active'   => true,
            'program_id'  => Program::inRandomOrder()->first()?->id,
            'session_id'  => AcademicSession::where('is_current', true)->first()?->id,
            'teacher_id'  => null,
        ];
    }
}
