<?php

namespace Database\Factories;

use App\Domains\Course\Models\CourseModule;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseModuleFactory extends Factory
{
    protected $model = CourseModule::class;

    public function definition(): array
    {
        static $order = 1;
        return [
            'course_id'  => null, // Must be provided by caller: CourseModule::factory()->for($course)->create()
            'title'      => 'Module ' . $this->faker->words(3, true),
            'sort_order' => $order++,
        ];
    }
}
