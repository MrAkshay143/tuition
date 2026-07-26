<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BundleController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\BatchController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\Admin\UserAdminController;
use App\Http\Controllers\Api\Admin\SettingsController;
use App\Http\Controllers\Api\Admin\ActivityLogController;
use App\Http\Controllers\Api\Admin\DeviceSessionController;
use App\Http\Controllers\Api\Admin\AnnouncementBlastController;
use App\Http\Controllers\Api\Admin\BackupController;
use App\Http\Controllers\Api\Admin\AdminAcademicDashboardController;
use App\Http\Controllers\Api\Admin\EducationTypeController;
use App\Http\Controllers\Api\Admin\ProgramController;
use App\Http\Controllers\Api\Admin\SubjectController;
use App\Http\Controllers\Api\Admin\AcademicSessionController;

// ── Public Auth Routes ────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login',          [AuthController::class, 'login'])->middleware('throttle:auth-login')->name('login');
    Route::post('forgot-password',[AuthController::class, 'forgotPassword'])->middleware('throttle:auth-forgot-password');
    Route::post('validate-reset-token', [AuthController::class, 'validateResetToken']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
    Route::get ('google',         [AuthController::class, 'redirectToGoogle']);
    Route::get ('google/callback',[AuthController::class, 'handleGoogleCallback']);
});

// ── Public Content & Health Routes ───────────────────────────────────────────
Route::get('health',         \App\Http\Controllers\Api\V1\HealthController::class);
Route::get('public/explore', [\App\Http\Controllers\Api\PublicExploreController::class, 'explore']);
Route::get('health/live',    [\App\Http\Controllers\Api\Admin\OperationsController::class, 'live']);
Route::get('health/ready',   [\App\Http\Controllers\Api\Admin\OperationsController::class, 'ready']);
Route::get('media/{media}/stream/{segment?}', [\App\Http\Controllers\Api\V1\MediaController::class, 'stream'])->name('api.v1.media.stream');
Route::get('public/lessons/{lesson}/stream', [\App\Http\Controllers\Api\V1\LessonController::class, 'stream']);

// ── Public CMS Routes ────────────────────────────────────────────────────────
Route::get('blogs', [\App\Http\Controllers\Api\V1\BlogController::class, 'index']);
Route::get('blogs/{slug}', [\App\Http\Controllers\Api\V1\BlogController::class, 'show']);
Route::get('achievements', [\App\Http\Controllers\Api\V1\AchievementController::class, 'index']);


// ── Authenticated Routes ──────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'active', \App\Http\Middleware\ValidateSessionBinding::class])->group(function () {

    // ── Academic Taxonomy (Global Search / Filters) ──
    Route::get('academic-taxonomy', [\App\Http\Controllers\Api\V1\AcademicTaxonomyController::class, 'index']);

    // ── Authenticated Lesson Video Stream (requires enrollment or admin/teacher role) ──
    Route::get('lessons/{lesson}/stream', [\App\Http\Controllers\Api\V1\LessonController::class, 'stream']);

    // ── Authentication & Profile ─────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::get ('me',              [AuthController::class, 'me']);
        Route::put ('profile',         [AuthController::class, 'updateProfile']);
        Route::post('change-password', [AuthController::class, 'changePassword']);

        Route::post('logout',          [AuthController::class, 'logout']);
        Route::put ('theme',           [AuthController::class, 'updateTheme']);
        Route::post('refresh',         [AuthController::class, 'refresh']);
    });

    Route::get('security/me', [\App\Http\Controllers\Api\V1\UserSessionController::class, 'me']);
    Route::get('search',      [\App\Http\Controllers\Api\GlobalSearchController::class, 'search']);

    // Multi-Device Management
    Route::prefix('sessions')->group(function () {
        Route::get   ('',             [\App\Http\Controllers\Api\V1\UserSessionController::class, 'index']);
        Route::post  ('revoke-other', [\App\Http\Controllers\Api\V1\UserSessionController::class, 'revokeOther']);
        Route::delete('{uuid}',       [\App\Http\Controllers\Api\V1\UserSessionController::class, 'destroy']);
        Route::put   ('{uuid}',       [\App\Http\Controllers\Api\V1\UserSessionController::class, 'update']);
        Route::post  ('{uuid}/trust', [\App\Http\Controllers\Api\V1\UserSessionController::class, 'toggleTrust']);
    });

    // ── Bundle endpoints (load entire page with 1 call) ──────────────────────
    Route::prefix('bundle')->group(function () {
        Route::get('dashboard',          [BundleController::class, 'teacherDashboard'])->middleware('role:teacher|admin');
        Route::get('student-dashboard',  [BundleController::class, 'studentDashboard'])->middleware('role:student');
        Route::get('student-profile/{id}',[BundleController::class, 'studentProfile'])->middleware('role:teacher|admin');
        Route::get('admin-overview',     [BundleController::class, 'adminOverview'])->middleware('role:admin');
    });

    Route::get('students/{id}/devices', [StudentController::class, 'devices'])->middleware('permission:student.view');

    // ── Students (teacher manages) ───────────────────────────────────────────
    Route::prefix('students')->middleware('permission:student.view')->group(function () {
        Route::get   ('',                    [StudentController::class, 'index']);
        Route::post  ('',                    [StudentController::class, 'store']);
        Route::post  ('bulk/suspend',        [StudentController::class, 'bulkSuspend']);
        Route::post  ('bulk/activate',       [StudentController::class, 'bulkActivate']);
        Route::post  ('bulk/logout',         [StudentController::class, 'bulkLogout']);
        Route::post  ('bulk/assign-course',  [StudentController::class, 'bulkAssignCourse']);
        Route::post  ('bulk/assign-batch',   [StudentController::class, 'bulkAssignBatch']);
        Route::get   ('{id}',               [StudentController::class, 'show']);
        Route::put   ('{id}',               [StudentController::class, 'update']);
        Route::delete('{id}',               [StudentController::class, 'destroy']);
        Route::put   ('{id}/toggle-active', [StudentController::class, 'toggleActive']);
        Route::post  ('{id}/assign-batch',  [StudentController::class, 'assignBatch']);
        Route::post  ('{id}/remove-batch',  [StudentController::class, 'removeBatch']);
        Route::post  ('{id}/assign-course', [StudentController::class, 'assignCourse']);
        Route::post  ('{id}/remove-course', [StudentController::class, 'removeCourse']);
        Route::post  ('{id}/reset-password',[StudentController::class, 'resetPassword']);

        Route::post  ('{id}/force-logout',  [StudentController::class, 'forceLogout']);
        Route::post  ('{id}/lock',          [StudentController::class, 'lock']);
        Route::post  ('{id}/unlock',        [StudentController::class, 'unlock']);
        Route::post  ('{id}/suspend',       [StudentController::class, 'suspend']);
        Route::post  ('{id}/activate',      [StudentController::class, 'activate']);
        Route::post  ('{id}/send-notification', [StudentController::class, 'sendNotification']);
    });

    // ── Batches ──────────────────────────────────────────────────────────────
    Route::prefix('batches')->middleware('permission:batch.view')->group(function () {
        Route::get   ('',                          [BatchController::class, 'index']);
        Route::post  ('',                          [BatchController::class, 'store']);
        Route::get   ('{id}',                      [BatchController::class, 'show']);
        Route::put   ('{id}',                      [BatchController::class, 'update']);
        Route::delete('{id}',                      [BatchController::class, 'destroy']);
        Route::get   ('{id}/students',             [BatchController::class, 'students']);
        Route::post  ('{id}/students',             [BatchController::class, 'syncStudents']);
        Route::delete('{id}/students',             [BatchController::class, 'removeStudents']);
        Route::delete('{id}/students/{studentId}', [BatchController::class, 'removeStudent']);
        Route::get   ('{id}/courses',              [BatchController::class, 'courses']);
        Route::post  ('{id}/courses',              [BatchController::class, 'assignCourses']);
        Route::delete('{id}/courses',              [BatchController::class, 'removeCourses']);
    });

    // ── Notifications ────────────────────────────────────────────────────────
    Route::prefix('notifications')->group(function () {
        Route::get ('',                    [NotificationController::class, 'index']);
        Route::get ('unread-count',        [NotificationController::class, 'unreadCount']);
        Route::post('{id}/read',           [NotificationController::class, 'markRead']);
        Route::post('read-all',            [NotificationController::class, 'markAllRead']);
        Route::get ('preferences',         [NotificationController::class, 'preferences']);
        Route::put ('preferences',         [NotificationController::class, 'updatePreferences']);
        Route::post('fcm-token',           [NotificationController::class, 'updateFcmToken']);
    });

    // ── Announcements (All Authenticated Roles) ──────────────────────────────
    Route::prefix('announcements')->group(function () {
        Route::get('', [\App\Http\Controllers\Api\V1\AnnouncementController::class, 'index']);
        Route::post('', [\App\Http\Controllers\Api\V1\AnnouncementController::class, 'store']);
        Route::get('{id}', [\App\Http\Controllers\Api\V1\AnnouncementController::class, 'show']);
        Route::delete('{id}', [\App\Http\Controllers\Api\V1\AnnouncementController::class, 'destroy']);
    });

    // 💬 Chat System (All Authenticated Roles) 💬
    Route::prefix('chat')->middleware('throttle:1000,1')->group(function () {
        Route::get('conversations', [\App\Http\Controllers\Api\V1\ChatController::class, 'conversations']);
        Route::get('messages/sync', [\App\Http\Controllers\Api\V1\ChatController::class, 'syncMessages']);
        Route::get('messages/{userId}', [\App\Http\Controllers\Api\V1\ChatController::class, 'thread']);
        Route::post('messages/{userId}', [\App\Http\Controllers\Api\V1\ChatController::class, 'send'])->middleware('throttle:30,1');
        
        // Message Actions
        Route::patch('messages/status/{uuid}', [\App\Http\Controllers\Api\V1\ChatController::class, 'updateStatus']);
        Route::patch('messages/action/{uuid}', [\App\Http\Controllers\Api\V1\ChatController::class, 'messageAction']);
        Route::patch('messages/{userId}/read', [\App\Http\Controllers\Api\V1\ChatController::class, 'markRead']);
        Route::get('unread-count', [\App\Http\Controllers\Api\V1\ChatController::class, 'unreadCount']);
        Route::post('presence', [\App\Http\Controllers\Api\V1\ChatController::class, 'presence']);
        Route::get('partner-course-videos/{partnerId}', [\App\Http\Controllers\Api\V1\ChatController::class, 'partnerCourseVideos']);

        // Signaling & Config
        Route::get('webrtc-config', [\App\Http\Controllers\Api\V1\ChatSignalingController::class, 'getConfig']);
        Route::post('signal', [\App\Http\Controllers\Api\V1\ChatSignalingController::class, 'postSignal']);
        Route::post('signal/{partnerId}', [\App\Http\Controllers\Api\V1\ChatSignalingController::class, 'postSignalPartner']);
        Route::get('signals', [\App\Http\Controllers\Api\V1\ChatSignalingController::class, 'getSignals']);
    });

    // ── Student Learning Platform (LXP) ───────────────────────────────────────
    Route::middleware('permission:dashboard.view')->group(function () {

        Route::get('student/dashboard', [\App\Http\Controllers\Api\V1\StudentLearningController::class, 'dashboard']);
        Route::get('student/progress', [\App\Http\Controllers\Api\V1\StudentLearningController::class, 'progress']);
        Route::get('student/history', [\App\Http\Controllers\Api\V1\StudentLearningController::class, 'history']);
        Route::get('student/continue-learning', [\App\Http\Controllers\Api\V1\StudentLearningController::class, 'continueLearning']);
        Route::get('student/bookmarks', [\App\Http\Controllers\Api\V1\BookmarkController::class, 'index']);
        
        // Assignments (Student)
        Route::get('student/assignments', [\App\Http\Controllers\Api\V1\AssignmentController::class, 'studentIndex']);
        Route::post('student/assignments/{id}/submit', [\App\Http\Controllers\Api\V1\AssignmentController::class, 'submit'])->middleware('permission:assignment.submit');

        // Exams (Student)
        Route::get('student/exams', [\App\Http\Controllers\Api\V1\ExamController::class, 'studentIndex'])->middleware('permission:exam.view');
        Route::get('student/exams/{id}/result', [\App\Http\Controllers\Api\V1\ExamController::class, 'studentResult'])->middleware('permission:exam.attempt');
        Route::post('student/exams/{id}/start', [\App\Http\Controllers\Api\V1\ExamController::class, 'start'])->middleware('permission:exam.attempt');
        Route::post('student/exams/{id}/submit', [\App\Http\Controllers\Api\V1\ExamController::class, 'submit'])->middleware('permission:exam.attempt');
        Route::post('student/exams/{id}/security-log', [\App\Http\Controllers\Api\V1\ExamController::class, 'logSecurityEvent'])->middleware('permission:exam.attempt');

        // Live Classes (Student)
        Route::get('student/live-classes', [\App\Http\Controllers\Api\V1\LiveClassController::class, 'index']);
        Route::post('live-classes/{id}/attendance', [\App\Http\Controllers\Api\V1\LiveClassController::class, 'recordAttendance'])->middleware('permission:live_class.view');

        // Study Materials (Student)
        Route::get('student/media', [\App\Http\Controllers\Api\V1\MediaController::class, 'index']);

        Route::patch('lessons/{lesson}/complete', [\App\Http\Controllers\Api\V1\StudentLearningController::class, 'complete']);
        Route::post('lessons/{lesson}/bookmark', [\App\Http\Controllers\Api\V1\BookmarkController::class, 'store']);
        Route::delete('lessons/{lesson}/bookmark', [\App\Http\Controllers\Api\V1\BookmarkController::class, 'destroy']);
    });

    // Idempotent position/progress sync (accessible by enrolled students, teachers, admins)
    Route::get('lessons/{id}/progress',  [\App\Http\Controllers\Api\V1\StudentLearningController::class, 'lessonProgress']);
    Route::post('lessons/{id}/progress', [\App\Http\Controllers\Api\V1\StudentLearningController::class, 'updateProgress']);

    // Course-level resume: returns last watched lesson + position for a course
    Route::get('courses/{course}/resume', [\App\Http\Controllers\Api\V1\CourseResumeController::class, 'show']);

    // ── Health Check ──────────────────────────────────────────────────────────
    Route::get('health', \App\Http\Controllers\Api\V1\HealthController::class);

    // ── Courses Management (V1) ────────────────────────────────────────────────
    Route::middleware('role:admin|teacher')->group(function () {
        Route::apiResource('courses', \App\Http\Controllers\Api\V1\CourseController::class);
        Route::patch('courses/{id}/publish', \App\Http\Controllers\Api\V1\CoursePublishController::class);
        Route::patch('courses/{id}/archive', [\App\Http\Controllers\Api\V1\CourseArchiveController::class, 'archive']);
        Route::patch('courses/{id}/restore', [\App\Http\Controllers\Api\V1\CourseArchiveController::class, 'restore']);
        Route::post('courses/{id}/duplicate', \App\Http\Controllers\Api\V1\CourseDuplicateController::class);
        Route::get('courses/{id}/activity-logs', [\App\Http\Controllers\Api\V1\CourseAuditController::class, 'activityLogs']);
        Route::get('courses/{id}/publish-history', [\App\Http\Controllers\Api\V1\CourseAuditController::class, 'publishHistory']);

        // Modules
        Route::post('courses/{courseId}/modules', [\App\Http\Controllers\Api\V1\ModuleController::class, 'store']);
        Route::put('modules/{id}', [\App\Http\Controllers\Api\V1\ModuleController::class, 'update']);
        Route::delete('modules/{id}', [\App\Http\Controllers\Api\V1\ModuleController::class, 'destroy']);
        Route::patch('courses/{courseId}/modules/reorder', \App\Http\Controllers\Api\V1\ModuleOrderController::class);
        // Legacy backward compatibility
        Route::post('modules/{moduleId}/lessons', [\App\Http\Controllers\Api\V1\LessonController::class, 'storeLegacy']);
        
        // Lessons
        Route::post('chapters/{chapterId}/lessons', [\App\Http\Controllers\Api\V1\LessonController::class, 'store']);
        Route::put('lessons/{id}', [\App\Http\Controllers\Api\V1\LessonController::class, 'update']);
        Route::patch('lessons/{id}/autosave', [\App\Http\Controllers\Api\V1\LessonController::class, 'autosave']);
        Route::delete('lessons/{id}', [\App\Http\Controllers\Api\V1\LessonController::class, 'destroy']);
        Route::get('lessons/{lesson}/stream', [\App\Http\Controllers\Api\V1\LessonController::class, 'stream']);
        Route::patch('chapters/{chapterId}/lessons/reorder', \App\Http\Controllers\Api\V1\LessonOrderController::class);

        // Course Locks
        Route::post('courses/{id}/lock', [\App\Http\Controllers\Api\V1\CourseLockController::class, 'lock']);
        Route::post('courses/{id}/unlock', [\App\Http\Controllers\Api\V1\CourseLockController::class, 'unlock']);

        // Course Versions
        Route::get('courses/{courseId}/versions', [\App\Http\Controllers\Api\V1\CourseVersionController::class, 'index']);
        Route::post('courses/{courseId}/versions', [\App\Http\Controllers\Api\V1\CourseVersionController::class, 'store']);
        Route::post('courses/{courseId}/versions/{versionId}/restore', [\App\Http\Controllers\Api\V1\CourseVersionController::class, 'restore']);

        // Course Import/Export
        Route::get('courses/{id}/export', [\App\Http\Controllers\Api\V1\CourseImportExportController::class, 'export']);
        Route::post('courses/import', [\App\Http\Controllers\Api\V1\CourseImportExportController::class, 'import']);

        // Module Collapse State
        Route::post('modules/{moduleId}/state', \App\Http\Controllers\Api\V1\ModuleStateController::class);

        // Media Library
        Route::get('media/recycle-bin', [\App\Http\Controllers\Api\V1\MediaController::class, 'recycleBin']);
        Route::post('media/bulk-delete', [\App\Http\Controllers\Api\V1\MediaController::class, 'bulkDelete']);
        Route::post('media/bulk-publish', [\App\Http\Controllers\Api\V1\MediaController::class, 'bulkPublish']);
        Route::post('media/bulk-archive', [\App\Http\Controllers\Api\V1\MediaController::class, 'bulkArchive']);
        Route::post('media/bulk-category', [\App\Http\Controllers\Api\V1\MediaController::class, 'bulkCategory']);
        
        Route::get('media', [\App\Http\Controllers\Api\V1\MediaController::class, 'index']);
        Route::get('media/{id}', [\App\Http\Controllers\Api\V1\MediaController::class, 'show']);
        Route::get('media/{id}/download', [\App\Http\Controllers\Api\V1\MediaController::class, 'download']);
        Route::post('media', [\App\Http\Controllers\Api\V1\MediaController::class, 'upload']);
        Route::post('media/upload', [\App\Http\Controllers\Api\V1\MediaController::class, 'upload']);
        Route::post('media/youtube', [\App\Http\Controllers\Api\V1\MediaController::class, 'youtube']);
        Route::put('media/{id}', [\App\Http\Controllers\Api\V1\MediaController::class, 'update']);
        Route::delete('media/{id}', [\App\Http\Controllers\Api\V1\MediaController::class, 'destroy']);
        Route::get('media/{id}/usage', [\App\Http\Controllers\Api\V1\MediaController::class, 'usage']);
        Route::get('media/{id}/stream-url', [\App\Http\Controllers\Api\V1\MediaController::class, 'streamUrl']);
        Route::post('media/{id}/replace', [\App\Http\Controllers\Api\V1\MediaController::class, 'replace']);
        Route::post('media/{id}/restore', [\App\Http\Controllers\Api\V1\MediaController::class, 'restore']);
        Route::apiResource('content-categories', \App\Http\Controllers\Api\V1\ContentCategoryController::class)->only(['index', 'store', 'destroy']);

        // Lesson Dependencies
        Route::post('lessons/{id}/dependencies', [\App\Http\Controllers\Api\V1\LessonDependencyController::class, 'store']);
        Route::delete('lessons/{id}/dependencies/{prerequisiteId}', [\App\Http\Controllers\Api\V1\LessonDependencyController::class, 'destroy']);

        // Assignments (Teacher/Admin)
        Route::get('assignments', [\App\Http\Controllers\Api\V1\AssignmentController::class, 'index']);
        Route::post('assignments', [\App\Http\Controllers\Api\V1\AssignmentController::class, 'store']);
        Route::get('assignments/{id}', [\App\Http\Controllers\Api\V1\AssignmentController::class, 'show']);
        Route::put('assignments/{id}', [\App\Http\Controllers\Api\V1\AssignmentController::class, 'update']);
        Route::delete('assignments/{id}', [\App\Http\Controllers\Api\V1\AssignmentController::class, 'destroy']);

        // ── Certificates ────────────────────────────────────────────────────────
        Route::get('certificates', [\App\Http\Controllers\Api\V1\CertificateController::class, 'index']);
        Route::get('certificates/{id}/download', [\App\Http\Controllers\Api\V1\CertificateController::class, 'download']);

        Route::get('assignments/{id}/submissions', [\App\Http\Controllers\Api\V1\AssignmentController::class, 'submissions']);
        Route::post('assignments/{id}/submissions/{submissionId}/grade', [\App\Http\Controllers\Api\V1\AssignmentController::class, 'grade']);

        // Question Bank (Global)
        Route::get('questions/topics', [\App\Http\Controllers\Api\V1\QuestionController::class, 'getTopics']);
        Route::get('questions/difficulties', [\App\Http\Controllers\Api\V1\QuestionController::class, 'getDifficulties']);
        Route::apiResource('questions', \App\Http\Controllers\Api\V1\QuestionController::class);

        // Exams (Teacher/Admin)
        Route::get('exams', [\App\Http\Controllers\Api\V1\ExamController::class, 'index']);
        Route::post('exams', [\App\Http\Controllers\Api\V1\ExamController::class, 'store']);
        Route::get('exams/{id}', [\App\Http\Controllers\Api\V1\ExamController::class, 'show']);
        Route::put('exams/{id}', [\App\Http\Controllers\Api\V1\ExamController::class, 'update']);
        Route::delete('exams/{id}', [\App\Http\Controllers\Api\V1\ExamController::class, 'destroy']);
        Route::get('exams/{id}/questions', [\App\Http\Controllers\Api\V1\ExamController::class, 'questions']);
        Route::post('exams/{id}/questions', [\App\Http\Controllers\Api\V1\ExamController::class, 'addQuestion']);
        Route::post('exams/{id}/questions/attach', [\App\Http\Controllers\Api\V1\ExamController::class, 'attachQuestion']);
        Route::put('exams/{id}/questions/{qId}', [\App\Http\Controllers\Api\V1\ExamController::class, 'updateQuestion']);
        Route::delete('exams/{id}/questions/{qId}', [\App\Http\Controllers\Api\V1\ExamController::class, 'removeQuestion']);
        Route::post('exams/{id}/questions/sync', [\App\Http\Controllers\Api\V1\ExamController::class, 'syncQuestions']);
        Route::get('exams/{id}/attempts', [\App\Http\Controllers\Api\V1\ExamController::class, 'attempts']);
        Route::get('exams/{id}/attempts/{attempt_id}', [\App\Http\Controllers\Api\V1\ExamController::class, 'attemptDetails']);

        // Live Classes (Teacher/Admin)
        Route::apiResource('live-classes', \App\Http\Controllers\Api\V1\LiveClassController::class);
        Route::patch('live-classes/{id}/start', [\App\Http\Controllers\Api\V1\LiveClassController::class, 'start']);
        Route::patch('live-classes/{id}/end', [\App\Http\Controllers\Api\V1\LiveClassController::class, 'end']);

        // Alias routes for frontend compatibility
        Route::middleware('permission:system.manage')->group(function () {
            Route::get('admin/live-classes', [\App\Http\Controllers\Api\V1\LiveClassController::class, 'index']);
            Route::post('admin/live-classes', [\App\Http\Controllers\Api\V1\LiveClassController::class, 'store']);
            Route::delete('admin/live-classes/{id}', [\App\Http\Controllers\Api\V1\LiveClassController::class, 'destroy']);
        });

        Route::middleware('role:teacher|admin')->group(function () {
            Route::get('teacher/live-classes', [\App\Http\Controllers\Api\V1\LiveClassController::class, 'index']);
            Route::post('teacher/live-classes', [\App\Http\Controllers\Api\V1\LiveClassController::class, 'store']);
            Route::delete('teacher/live-classes/{id}', [\App\Http\Controllers\Api\V1\LiveClassController::class, 'destroy']);
        });

        // Academic Taxonomy Read/Write (Teacher/Admin)
        Route::get('education-types',  [EducationTypeController::class, 'index']);
        Route::get('programs',         [ProgramController::class, 'index']);
        Route::get('subjects',         [SubjectController::class, 'index']);
        Route::get('academic-sessions', [AcademicSessionController::class, 'index']);
    });

    // ── Common Users Read Route ──────────────────────────────────────────────
    Route::get('users', [\App\Http\Controllers\Api\Admin\UserAdminController::class, 'index']);

    // ── Admin ────────────────────────────────────────────────────────────────
    Route::prefix('admin')->middleware('permission:system.manage')->group(function () {
        Route::get ('academic/dashboard-stats', [AdminAcademicDashboardController::class, 'getStats']);
        Route::get ('users',                    [UserAdminController::class, 'index']);
        Route::post('users',                    [UserAdminController::class, 'store']);
        Route::put ('users/{id}',               [UserAdminController::class, 'update']);
        Route::delete('users/{id}',             [UserAdminController::class, 'destroy']);
        Route::put ('users/{id}/toggle-active', [UserAdminController::class, 'toggleActive']);

        // Roles & Permissions
        Route::get ('roles',                    [\App\Http\Controllers\Api\Admin\RoleAdminController::class, 'index']);
        Route::get ('roles/{id}',               [\App\Http\Controllers\Api\Admin\RoleAdminController::class, 'show']);
        Route::put ('roles/{id}/permissions',   [\App\Http\Controllers\Api\Admin\RoleAdminController::class, 'updatePermissions']);

        Route::get ('settings',                 [SettingsController::class, 'index']);
        Route::put ('settings',                 [SettingsController::class, 'update']);
        Route::post('settings/test-email',      [SettingsController::class, 'testEmail']);

        Route::get ('security/session-policies',    [\App\Http\Controllers\Api\Admin\SessionPolicyController::class, 'show']);
        Route::put ('security/session-policies',    [\App\Http\Controllers\Api\Admin\SessionPolicyController::class, 'update']);
        Route::put ('security/user-override/{id}',  [\App\Http\Controllers\Api\Admin\SessionPolicyController::class, 'updateUserOverride']);

        Route::get ('activity-logs',            [ActivityLogController::class, 'index']);
        Route::get ('activity-logs/stats',      [ActivityLogController::class, 'stats']);
        Route::get ('logs/stats',               [ActivityLogController::class, 'stats']);

        Route::get ('device-sessions',          [DeviceSessionController::class, 'index']);
        Route::delete('device-sessions/{id}',   [DeviceSessionController::class, 'destroy']);
        Route::delete('device-sessions/all',    [DeviceSessionController::class, 'destroyAll']);
        Route::post('security/clear-remember-me',    [DeviceSessionController::class, 'clearRememberTokens']);
        Route::post('security/force-password-reset', [DeviceSessionController::class, 'forcePasswordReset']);
        Route::post('security/enforce-password-reset', [DeviceSessionController::class, 'forcePasswordReset']);
        Route::post('security/block-suspicious-ips', [DeviceSessionController::class, 'blockSuspiciousIps']);

        Route::post('announcement-blast',       [AnnouncementBlastController::class, 'send']);

        Route::get ('operations/details',       [\App\Http\Controllers\Api\Admin\OperationsController::class, 'details']);
        Route::post('operations/backup',        [\App\Http\Controllers\Api\Admin\OperationsController::class, 'backup']);
        Route::post('operations/restore',       [\App\Http\Controllers\Api\Admin\OperationsController::class, 'restore']);
        Route::get ('backup',                   [BackupController::class, 'index']);
        Route::post('backup',                   [BackupController::class, 'create']);
        Route::post('backup/{id}/restore',       [BackupController::class, 'restore']);
        Route::delete('backup/{id}',            [BackupController::class, 'destroy']);
        Route::get ('backup/{id}/download',     [BackupController::class, 'download']);
        Route::get ('export/{type}',            [BackupController::class, 'exportCsv']);

        // ── CMS Management ────────────────────────────────────────────────────────
        Route::apiResource('blogs', \App\Http\Controllers\Api\Admin\BlogAdminController::class);
        Route::apiResource('achievements', \App\Http\Controllers\Api\Admin\AchievementAdminController::class);

        // ── Academic Taxonomy Management ────────────────────────────────────────
        // Education Types
        Route::get   ('education-types',             [EducationTypeController::class, 'index']);
        Route::post  ('education-types',             [EducationTypeController::class, 'store']);
        Route::get   ('education-types/{id}',        [EducationTypeController::class, 'show']);
        Route::put   ('education-types/{id}',        [EducationTypeController::class, 'update']);
        Route::delete('education-types/{id}',        [EducationTypeController::class, 'destroy']);
        Route::post  ('education-types/{id}/restore',[EducationTypeController::class, 'restore']);

        // Programs
        Route::get   ('programs',             [ProgramController::class, 'index']);
        Route::post  ('programs',             [ProgramController::class, 'store']);
        Route::get   ('programs/{id}',        [ProgramController::class, 'show']);
        Route::put   ('programs/{id}',        [ProgramController::class, 'update']);
        Route::delete('programs/{id}',        [ProgramController::class, 'destroy']);
        Route::post  ('programs/{id}/restore',[ProgramController::class, 'restore']);

        // Subjects
        Route::get   ('subjects',             [SubjectController::class, 'index']);
        Route::post  ('subjects',             [SubjectController::class, 'store']);
        Route::get   ('subjects/{id}',        [SubjectController::class, 'show']);
        Route::put   ('subjects/{id}',        [SubjectController::class, 'update']);
        Route::delete('subjects/{id}',        [SubjectController::class, 'destroy']);
        Route::post  ('subjects/{id}/restore',[SubjectController::class, 'restore']);

        // Academic Sessions
        Route::get   ('academic-sessions',             [AcademicSessionController::class, 'index']);
        Route::post  ('academic-sessions',             [AcademicSessionController::class, 'store']);
        Route::get   ('academic-sessions/{id}',        [AcademicSessionController::class, 'show']);
        Route::put   ('academic-sessions/{id}',        [AcademicSessionController::class, 'update']);
        Route::delete('academic-sessions/{id}',        [AcademicSessionController::class, 'destroy']);
        Route::post  ('academic-sessions/{id}/restore',[AcademicSessionController::class, 'restore']);

        // Real CSV Data Exports
        Route::get('export/students',    [BackupController::class, 'exportCsvStudent']);
        Route::get('export/batches',     [BackupController::class, 'exportCsvBatch']);
        Route::get('export/assignments', [BackupController::class, 'exportCsvAssignment']);
        Route::get('export/exams',       [BackupController::class, 'exportCsvExam']);
        Route::get('export/logs',        [BackupController::class, 'exportCsvLog']);
        Route::get('export/{type}',      [BackupController::class, 'exportCsv']);
    });
});
