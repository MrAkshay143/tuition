<?php

namespace App\Domains\Course\Services;

use App\Domains\Course\Models\Course;
use App\Domains\Core\Models\Batch;
use App\Domains\Settings\Models\Setting;
use App\Domains\Academic\Models\EducationType;
use App\Domains\Academic\Models\Subject;

class PublicExploreService
{
    /**
     * Get explore data including courses, batches, education types, subjects, and settings.
     */
    public function getExploreData(bool $isAuthenticated): array
    {
        $courses = Course::where('status', 'published')
            ->with([
                'program:id,name,slug,education_type_id',
                'subject:id,name,slug,color',
                'modules.chapters.lessons.primaryMedia',
                'modules.chapters.lessons.downloadMedia',
            ])
            ->latest()
            ->get()
            ->map(function ($course) use ($isAuthenticated) {
                $course->modules_count = $course->modules->count();

                // Flatten chapters' lessons into module->lessons for clean frontend consumption
                $course->modules->transform(function ($module) use ($isAuthenticated) {
                    $lessons = $module->chapters->flatMap(function ($chapter) use ($isAuthenticated) {
                        return $chapter->lessons->map(function ($lesson) use ($isAuthenticated) {
                            $primaryMedia  = $lesson->primaryMedia->first();
                            $downloadMedia = $lesson->downloadMedia->first();

                            if ($primaryMedia) {
                                if (!empty($primaryMedia->original_name) && str_starts_with($primaryMedia->original_name, 'http')) {
                                    $primaryMedia->url = $primaryMedia->original_name;
                                } elseif (!empty($primaryMedia->path)) {
                                    $primaryMedia->url = (str_starts_with($primaryMedia->path, 'http')) 
                                        ? $primaryMedia->path 
                                        : "https://www.youtube.com/watch?v={$primaryMedia->path}";
                                }
                            }

                            $lessonData = [
                                'id'               => $lesson->id,
                                'title'            => $lesson->title,
                                'type'             => $lesson->type,
                                'duration_seconds' => $lesson->duration_seconds,
                                'is_free_preview'  => (bool) $lesson->is_free_preview,
                                'primary_media'    => $primaryMedia,
                                'download_media'   => $downloadMedia,
                            ];

                            if (!$isAuthenticated && !$lesson->is_free_preview) {
                                unset($lessonData['primary_media']);
                            }

                            return $lessonData;
                        });
                    });

                    $module->lessons = $lessons->values()->all();
                    unset($module->chapters);
                    return $module;
                });

                $course->lessons_count = $course->modules->sum(fn($m) => count($m->lessons ?? []));
                return $course;
            });

        $batches = Batch::active()->withCount('courses')->get();

        // Dynamic academic taxonomy for homepage sections
        $educationTypes = EducationType::with([
            'programs' => function ($q) {
                $q->where('is_active', true)
                  ->withCount('courses')
                  ->orderBy('order_index');
            }
        ])
        ->where('is_active', true)
        ->orderBy('order_index')
        ->get()
        ->map(function ($type) {
            return [
                'id'            => $type->id,
                'name'          => $type->name,
                'slug'          => $type->slug,
                'programs'      => $type->programs->map(fn($p) => [
                    'id'           => $p->id,
                    'name'         => $p->name,
                    'slug'         => $p->slug,
                    'courses_count'=> $p->courses_count,
                ]),
                'total_courses' => $type->programs->sum('courses_count'),
            ];
        });

        $subjects = Subject::where('is_active', true)
            ->withCount('courses')
            ->orderBy('order_index')
            ->get(['id', 'name', 'slug', 'color', 'code']);

        $settings = [
            'platform_name'          => Setting::get('platform_name', 'EduFlow'),
            'platform_url'           => Setting::get('platform_url', config('app.frontend_url', config('app.url'))),
            'favicon_url'            => Setting::get('favicon_url', '/favicon.ico'),
            'seo_title'              => Setting::get('seo_title', 'EduFlow - Online Tuition & Private Batch Classroom'),
            'seo_description'        => Setting::get('seo_description', 'Interactive live classes, recorded video lectures, premium study notes, and dynamic progress trackers hosted directly by your teacher.'),
            'seo_keywords'           => Setting::get('seo_keywords', 'online tuition, live classes, recorded lectures, study materials, batch classroom'),
            'landing_hero_title'     => Setting::get('landing_hero_title', 'Learn Smarter. Achieve More.'),
            'landing_hero_subtitle'  => Setting::get('landing_hero_subtitle', 'Join live interactive classes, watch recorded lessons, access premium study materials and accelerate your learning journey with expert guidance.'),
            'landing_hero_cta_text'  => Setting::get('landing_hero_cta_text', 'Explore Courses'),
            'landing_hero_video_url' => Setting::get('landing_hero_video_url', ''),
            'landing_nav_links'      => json_decode(Setting::get('landing_nav_links', '[]'), true),
            'landing_about_config'   => json_decode(Setting::get('landing_about_config', '{}'), true),
            'landing_features'       => json_decode(Setting::get('landing_features', '[]'), true),
            'landing_why_choose'     => json_decode(Setting::get('landing_why_choose', '[]'), true),
            'landing_testimonials'   => json_decode(Setting::get('landing_testimonials', '[]'), true),
            'landing_faqs'           => json_decode(Setting::get('landing_faqs', '[]'), true),
            'landing_footer_links'   => json_decode(Setting::get('landing_footer_links', '[]'), true),
            'landing_social_links'   => json_decode(Setting::get('landing_social_links', '[]'), true),
            'stats_students'         => Setting::get('stats_students', ''),
            'stats_lectures'         => Setting::get('stats_lectures', ''),
            'stats_live_classes'     => Setting::get('stats_live_classes', ''),
            'stats_success_rate'     => Setting::get('stats_success_rate', ''),
        ];

        return [
            'courses'         => $courses,
            'batches'         => $batches,
            'education_types' => $educationTypes,
            'subjects'        => $subjects,
            'settings'        => $settings,
        ];
    }
}

