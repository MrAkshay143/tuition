# Milestone 2 – Enterprise Course Authoring Platform
## Production Implementation Backlog

==================================================
1. CORE FOUNDATION
==================================================

Core Domain
-----------
- `[ ]` Create App/Domains/Core/
- `[ ]` Create Contracts/
- `[ ]` Create Enums/
- `[ ]` Create DTOs/
- `[ ]` Create Exceptions/
- `[ ]` Create Traits/
- `[ ]` Create Helpers/
- `[ ]` Create Shared Services/

Strong PHP Enums
----------------
- `[ ]` CourseStatus
- `[ ]` LessonStatus
- `[ ]` LessonType
- `[ ]` UserRole
- `[ ]` Visibility
- `[ ]` MediaProvider
- `[ ]` NotificationChannel
- `[ ]` ThemeMode
- `[ ]` CompletionRule
- `[ ]` PublishState

Contracts
---------
- `[ ]` StorageProviderInterface
- `[ ]` MediaProviderInterface
- `[ ]` NotificationProviderInterface
- `[ ]` ImportExportInterface

Utilities
----------
- `[ ]` API Idempotency
- `[ ]` Response Helper
- `[ ]` UUID Helper
- `[ ]` Slug Generator
- `[ ]` Validation Pipeline

==================================================
2. DATABASE
==================================================

- `[ ]` course_versions
- `[ ]` course_settings
- `[ ]` course_edit_sessions
- `[ ]` module_states
- `[ ]` lesson_dependencies
- `[ ]` lesson_versions
- `[ ]` course_activity_logs
- `[ ]` course_publish_history

Indexes
--------
- `[ ]` Foreign Keys
- `[ ]` Composite Indexes
- `[ ]` UUID indexes
- `[ ]` Search indexes

==================================================
3. BACKEND API (V1)
==================================================

Routes
------
- `[ ]` /api/v1

Controllers
-----------
- `[ ]` CourseController
- `[ ]` CoursePublishController
- `[ ]` CourseArchiveController
- `[ ]` CourseDuplicateController
- `[ ]` CourseAutosaveController
- `[ ]` CourseLockController
- `[ ]` CourseImportExportController
- `[ ]` ModuleController
- `[ ]` ModuleOrderController
- `[ ]` LessonController
- `[ ]` LessonOrderController

Health
------
- `[ ]` HealthController

==================================================
4. DOMAIN ACTIONS
==================================================

Courses
--------
- `[ ]` CreateCourseAction
- `[ ]` UpdateCourseAction
- `[ ]` DeleteCourseAction
- `[ ]` RestoreCourseAction
- `[ ]` PublishCourseAction
- `[ ]` ArchiveCourseAction
- `[ ]` DuplicateCourseAction

Modules
--------
- `[ ]` CreateModuleAction
- `[ ]` UpdateModuleAction
- `[ ]` DeleteModuleAction
- `[ ]` ReorderModulesAction

Lessons
--------
- `[ ]` CreateLessonAction
- `[ ]` UpdateLessonAction
- `[ ]` DeleteLessonAction
- `[ ]` ReorderLessonsAction
- `[ ]` AutoSaveLessonAction

Versioning
----------
- `[ ]` CreateCourseVersionAction
- `[ ]` RestoreCourseVersionAction

Locks
-----
- `[ ]` AcquireCourseLockAction
- `[ ]` ReleaseCourseLockAction

Import / Export
---------------
- `[ ]` ImportCourseAction
- `[ ]` ExportCourseAction

==================================================
5. SERVICES
==================================================

- `[ ]` PublishValidationService
- `[ ]` CourseBuilderService
- `[ ]` CourseImportService
- `[ ]` CourseExportService
- `[ ]` CourseVersionService
- `[ ]` CourseLockService
- `[ ]` MediaAttachService
- `[ ]` SearchService

==================================================
6. FRONTEND
==================================================

Course Builder
--------------
- `[ ]` CourseTree
- `[ ]` ModuleTree
- `[ ]` LessonTree
- `[ ]` LessonEditor
- `[ ]` CourseSettings
- `[ ]` PublishPanel
- `[ ]` VersionHistoryPanel
- `[ ]` MediaSidebar
- `[ ]` PropertiesPanel

UX
--
- `[ ]` Drag & Drop
- `[ ]` Multi Select
- `[ ]` Bulk Actions
- `[ ]` Autosave
- `[ ]` Undo
- `[ ]` Redo
- `[ ]` Keyboard Shortcuts
- `[ ]` Optimistic Updates

==================================================
7. MEDIA
==================================================

- `[ ]` Media Library
- `[ ]` Upload
- `[ ]` Search
- `[ ]` Replace
- `[ ]` Delete
- `[ ]` Attach
- `[ ]` Usage Tracking

Providers
----------
- `[ ]` Local
- `[ ]` YouTube
- `[ ]` Cloudflare R2
- `[ ]` Amazon S3

==================================================
8. COURSE PUBLISHING
==================================================

Workflow
--------
- `[ ]` Draft
- `[ ]` In Review
- `[ ]` Approved
- `[ ]` Published
- `[ ]` Archived

Checklist
----------
- `[ ]` Thumbnail
- `[ ]` Description
- `[ ]` Modules
- `[ ]` Lessons
- `[ ]` Media
- `[ ]` Settings
- `[ ]` Completion Rules
- `[ ]` SEO

==================================================
9. EVENTS & QUEUES
==================================================

Events
------
- `[ ]` CourseCreated
- `[ ]` CourseUpdated
- `[ ]` CoursePublished
- `[ ]` CourseArchived
- `[ ]` LessonCreated
- `[ ]` LessonUpdated
- `[ ]` LessonDeleted
- `[ ]` LessonMoved

Queues
------
- `[ ]` Media
- `[ ]` Notifications
- `[ ]` Export
- `[ ]` Import
- `[ ]` Analytics

==================================================
10. SECURITY
==================================================

- `[ ]` Policies
- `[ ]` Authorization
- `[ ]` Validation
- `[ ]` Idempotency
- `[ ]` Rate Limiting
- `[ ]` Activity Logs
- `[ ]` Audit Logs

==================================================
11. TESTING
==================================================

Backend
-------
- `[ ]` PHPUnit
- `[ ]` Feature Tests
- `[ ]` Policy Tests
- `[ ]` API Tests
- `[ ]` Validation Tests

Frontend
--------
- `[ ]` TypeScript
- `[ ]` ESLint
- `[ ]` Responsive
- `[ ]` Theme
- `[ ]` Accessibility

Integration
-----------
- `[ ]` Course CRUD
- `[ ]` Module CRUD
- `[ ]` Lesson CRUD
- `[ ]` Publish
- `[ ]` Archive
- `[ ]` Duplicate
- `[ ]` Version Restore
- `[ ]` Import
- `[ ]` Export
- `[ ]` Locking
- `[ ]` Autosave

==================================================
12. PRODUCTION VERIFICATION
==================================================

Build
-----
- `[ ]` npm run build
- `[ ]` php artisan test
- `[ ]` php artisan route:list
- `[ ]` php artisan migrate:fresh --seed

Verification
------------
- `[ ]` Light Theme
- `[ ]` Dark Theme
- `[ ]` System Theme
- `[ ]` Desktop
- `[ ]` Tablet
- `[ ]` Mobile
- `[ ]` Keyboard Navigation
- `[ ]` Screen Reader
- `[ ]` Zero Console Errors
- `[ ]` Zero Network Errors
- `[ ]` Queue Processing
- `[ ]` Storage
- `[ ]` Health Endpoint

==================================================
SUCCESS CRITERIA
==================================================

The milestone is complete only when:

- `[ ]` No seeded course management remains.
- `[ ]` All CRUD operations persist to the database.
- `[ ]` Course Builder is fully dynamic.
- `[ ]` Module and lesson ordering persists.
- `[ ]` Autosave works reliably.
- `[ ]` Version history can be restored.
- `[ ]` Import/export works using .eduflow packages.
- `[ ]` Concurrent editing is handled safely.
- `[ ]` Teachers can only manage their own courses.
- `[ ]` Students only access published content.
- `[ ]` All pages support Light, Dark, and System themes.
- `[ ]` Accessibility meets WCAG 2.2 AA.
- `[ ]` All automated tests pass.
- `[ ]` No placeholder or mock functionality remains.
