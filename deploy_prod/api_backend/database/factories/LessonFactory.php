<?php

namespace Database\Factories;

use App\Domains\Course\Models\Lesson;
use Illuminate\Database\Eloquent\Factories\Factory;

class LessonFactory extends Factory
{
    protected $model = Lesson::class;

    public function definition(): array
    {
        static $order = 1;
        return [
            'chapter_id'       => null, // Must be provided by caller
            'title'            => ucwords($this->faker->words(5, true)),
            'type'             => $this->faker->randomElement(['video', 'notes', 'assignment', 'quiz']),
            'content'          => null,
            'duration_seconds' => $this->faker->numberBetween(300, 5400),
            'is_free_preview'  => $this->faker->boolean(20),
            'sort_order'       => $order++,
        ];
    }

    public function video(): static
    {
        return $this->state(['type' => 'video']);
    }

    public function freePreview(): static
    {
        return $this->state(['is_free_preview' => true]);
    }
}
