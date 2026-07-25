<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Domains\Academic\Models\EducationType;
use Illuminate\Support\Str;

class EducationTypeFactory extends Factory
{
    protected $model = EducationType::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->randomElement(['School', 'College', 'Competitive Exams', 'Skill Development']);
        
        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => $this->faker->sentence(),
            'is_active' => true,
            'order_index' => $this->faker->numberBetween(0, 10),
        ];
    }
}
