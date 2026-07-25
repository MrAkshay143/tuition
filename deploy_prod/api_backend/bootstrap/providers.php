<?php

use App\Providers\AppServiceProvider;
use App\Providers\CourseServiceProvider;
use App\Providers\MediaServiceProvider;
use App\Providers\LearningServiceProvider;
use App\Providers\AssessmentServiceProvider;

return [
    AppServiceProvider::class,
    CourseServiceProvider::class,
    MediaServiceProvider::class,
    LearningServiceProvider::class,
    AssessmentServiceProvider::class,
];
