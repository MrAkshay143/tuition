<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Domains\Academic\Models\Program;
use App\Domains\Academic\Models\EducationType;
use Illuminate\Support\Str;

class ProgramFactory extends Factory
{
    protected $model = Program::class;

    public function definition(): array
    {
        $name = $this->faker->words(3, true);
        return [
            'education_type_id' => EducationType::factory(),
            'academic_session_id' => null,
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'description' => $this->faker->paragraph(),
            'thumbnail' => null,
            'is_active' => true,
            'order_index' => $this->faker->numberBetween(0, 20),
        ];
    }
}
