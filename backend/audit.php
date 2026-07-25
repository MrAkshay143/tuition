<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$invalidBatchEnrollments = DB::table('enrollments as e')
    ->leftJoin('batches as b', 'e.batch_id', '=', 'b.id')
    ->whereNotNull('e.batch_id')
    ->whereNull('b.id')
    ->count();

$invalidCourseEnrollments = DB::table('enrollments as e')
    ->leftJoin('courses as c', 'e.course_id', '=', 'c.id')
    ->whereNotNull('e.course_id')
    ->whereNull('c.id')
    ->count();

$invalidUserEnrollments = DB::table('enrollments as e')
    ->leftJoin('users as u', 'e.user_id', '=', 'u.id')
    ->whereNotNull('e.user_id')
    ->whereNull('u.id')
    ->count();

echo json_encode([
    'invalid_batch' => $invalidBatchEnrollments,
    'invalid_course' => $invalidCourseEnrollments,
    'invalid_user' => $invalidUserEnrollments
], JSON_PRETTY_PRINT);
