<?php

namespace Database\Factories;

use App\Domains\Course\Models\Course;
use App\Domains\Academic\Models\Program;
use App\Domains\Academic\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        $title = $this->faker->words(4, true);
        return [
            'program_id'  => Program::inRandomOrder()->first()?->id ?? Program::factory()->create()->id,
            'subject_id'  => Subject::inRandomOrder()->first()?->id,
            'title'       => ucwords($title),
            'slug'        => Str::slug($title) . '-' . $this->faker->unique()->numberBetween(1000, 9999),
            'description' => $this->faker->paragraph(2),
            'thumbnail'   => null,
            'status'      => $this->faker->randomElement(['published', 'draft']),
            'price'       => $this->faker->randomElement([0, 499, 999, 1499, 1999]),
        ];
    }

    public function published(): static
    {
        return $this->state(['status' => 'published']);
    }
}
