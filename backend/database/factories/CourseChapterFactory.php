<?php

namespace Database\Factories;

use App\Domains\Course\Models\CourseChapter;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseChapterFactory extends Factory
{
    protected $model = CourseChapter::class;

    public function definition(): array
    {
        static $order = 1;
        return [
            'module_id'  => null, // Must be provided by caller
            'title'      => 'Chapter ' . $this->faker->words(2, true),
            'sort_order' => $order++,
        ];
    }
}
