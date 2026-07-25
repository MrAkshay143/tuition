<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Domains\Academic\Models\Subject;
use Illuminate\Support\Str;

class SubjectFactory extends Factory
{
    protected $model = Subject::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->randomElement([
            'Physics', 'Chemistry', 'Mathematics', 'Biology', 
            'Computer Science', 'English', 'History', 'Geography'
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'code' => strtoupper(substr($name, 0, 3)),
            'color' => $this->faker->hexColor(),
            'is_active' => true,
            'order_index' => $this->faker->numberBetween(0, 10),
        ];
    }
}
