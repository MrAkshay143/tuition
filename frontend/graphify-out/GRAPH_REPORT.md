# Graph Report - src  (2026-07-24)

## Corpus Check
- 158 files · ~307,920 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 833 nodes · 2277 edges · 41 communities (36 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40

## God Nodes (most connected - your core abstractions)
1. `cn()` - 77 edges
2. `Button` - 74 edges
3. `useAuthStore` - 57 edges
4. `Card` - 56 edges
5. `api` - 50 edges
6. `Badge()` - 48 edges
7. `useApiQuery()` - 43 edges
8. `Spinner()` - 41 edges
9. `Input` - 31 edges
10. `Modal()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `useMe()` --calls--> `useAuthStore`  [EXTRACTED]
  api/resources/auth.ts → store/index.ts
- `ImportBatchModal()` --calls--> `useApiMutation()`  [EXTRACTED]
  features/batches/ImportBatchModal.tsx → api/resources/hooks.ts
- `ExamTakingPage()` --calls--> `useApiMutation()`  [EXTRACTED]
  features/exams/ExamTakingPage.tsx → api/resources/hooks.ts
- `AdminSessionsPage()` --calls--> `getAdminUsers()`  [EXTRACTED]
  features/admin/AdminSessionsPage.tsx → api/resources/admin.ts
- `AdminSubjectsPage()` --calls--> `getAdminUsers()`  [EXTRACTED]
  features/admin/AdminSubjectsPage.tsx → api/resources/admin.ts

## Import Cycles
- None detected.

## Communities (41 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (70): About, AdminAnnouncementsPage, AdminBackupPage, AdminEducationTypesPage, AdminLogsPage, AdminOperationsPage, AdminOverviewPage, AdminProgramsPage (+62 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (44): BunnyPlayer(), CloudflarePlayer(), GenericEmbedPlayer(), GenericEmbedPlayerProps, VideoPlayer(), NativePlayer(), formatTime(), PlayerProps (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (54): blockSuspiciousIps(), clearRememberMe(), createAdminProgram(), createAdminUser(), deleteAdminBackup(), deleteAdminDeviceSession(), deleteAdminProgram(), deleteAdminUser() (+46 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (37): api, apiClient, removeToken(), useChatThread(), useConversations(), useMarkChatRead(), useSendMessage(), useAddQuestion() (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (32): CourseFilters, CourseProgram, CourseSubject, CourseSummary, useAdminCourses(), StudentFilters, useAssignBatch(), useAssignCourse() (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (25): useAnnouncements(), useCreateAnnouncement(), useDeleteAnnouncement(), useBatches(), useCreateLiveClass(), useRecordAttendance(), useStudentLiveClasses(), ConfirmModal() (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (31): getAllCourses(), AcademicSession, EducationType, Program, Subject, TaxonomyData, useAdminEducationTypes(), useAdminPrograms() (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (18): useApiMutation(), useApiQuery(), Spinner(), TeacherAnalyticsPage(), BatchDetailPage(), getStartOfWeek(), StudentCalendarPage(), getStartOfWeek() (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (18): PlaybackProvider(), clearProgress(), getAllProgress(), getPendingQueue(), getProgress(), openDB(), PendingSync, PlaybackRecord (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (20): useCreateExam(), AvatarProps, BadgeProps, ButtonProps, CardProps, EmptyStateProps, FilterBarProps, Input (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (23): AdminOverviewBundle, Announcement, AnnouncementForm, Assignment, AssignmentSubmission, Certificate, Chapter, DashboardBundle (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (21): mediaKeys, useBulkArchiveMedia(), useBulkCategoryMedia(), useBulkDeleteMedia(), useBulkPublishMedia(), useCategories(), useCreateCategory(), useDeleteCategory() (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (15): useAssignment(), useAssignments(), useAssignmentSubmissions(), useCreateAssignment(), useDeleteAssignment(), useGradeSubmission(), useStudentAssignments(), useSubmitAssignment() (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.21
Nodes (21): exportCourseAction(), useAcquireCourseLock(), useAddLesson(), useAddModule(), useCourseVersions(), useDeleteLesson(), useDeleteModule(), useDuplicateCourse() (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (13): useLogout(), useMarkAllRead(), useMarkRead(), useNotifications(), useUnreadCount(), Header(), pageTitles, SearchResults (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (15): useTheme(), ThemeProvider(), ThemeProviderProps, getSystemTheme(), Theme, ThemeState, useThemeStore, ExploreResponse (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (13): CourseThumbnail(), extractYoutubeId(), Divider(), FilterBar(), SearchBar(), StatsCard(), cn(), About() (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (4): Column, Props, Pagination(), PaginationProps

### Community 18 - "Community 18"
Cohesion: 0.21
Nodes (11): useDashboardBundle(), Avatar(), AdminOverviewPage(), container, item, container, getGreeting(), item (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (9): useExamResult(), Badge(), DEFAULT_COLORS, ImportBatchModal(), ParsedBatch, Props, CourseBuilderHeaderProps, ExamResultPage() (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.19
Nodes (9): getAdminActivityLogs(), Dropdown(), AdminLogsPage(), EVENT_BADGES, queryKeys, ActivityLog, ApiResponse, BatchForm (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (9): useForgotPassword(), useMe(), useResetPassword(), ForgotPasswordPage(), schema, ResetPasswordPage(), schema, AuthResponse (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.23
Nodes (10): AdminShell(), AppShell(), GlobalSearchModal(), SearchResults, adminNav, navByRole, NavItem, studentNav (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (3): Card, mockGallery, mockNotes

### Community 24 - "Community 24"
Cohesion: 0.26
Nodes (9): useStudentBookmarks(), useStudentDashboard(), useStudentProgress(), LessonViewerPage(), TeacherVideosPage(), StudentCoursesPage(), StudentDashboard(), StudentProgressPage() (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.28
Nodes (7): setToken(), AuthState, NotificationState, ThemeState, UIState, Notification, User

### Community 26 - "Community 26"
Cohesion: 0.31
Nodes (8): useCreateBatch(), useUpdateBatch(), Toggle(), AddEditBatchModal(), PRESET_COLORS, Props, schema, Batch

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (3): Button, mockPosts, mockPosts

### Community 28 - "Community 28"
Cohesion: 0.36
Nodes (5): App(), AuthLayout(), queryClient, Router, useThemeStore

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (4): ErrorBoundary, Props, RouteErrorBoundary(), State

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (6): useLogin(), LoginForm, LoginPage(), loginSchema, ROLE_CONFIG, Role

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (6): useDeleteBatch(), EmptyState(), BADGE_COLORS, BatchesPage(), container, item

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (6): adminTabs, MobileBottomNav(), studentTabs, Tab, tabsByRole, teacherTabs

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (5): *.css, *.jpg, *.png, *.svg, *.webp

### Community 34 - "Community 34"
Cohesion: 0.40
Nodes (3): DEFAULT_TABS, Props, Tab

### Community 35 - "Community 35"
Cohesion: 0.50
Nodes (3): QuestionBankPage(), QuestionItem, SAMPLE_QUESTIONS

## Knowledge Gaps
- **264 isolated node(s):** `apiClient`, `CourseProgram`, `CourseSubject`, `CourseSummary`, `CourseFilters` (+259 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `api` connect `Community 3` to `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 20`, `Community 21`, `Community 22`, `Community 24`, `Community 31`, `Community 35`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `useAuthStore` connect `Community 15` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 7`, `Community 8`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 18`, `Community 21`, `Community 22`, `Community 24`, `Community 25`, `Community 26`, `Community 30`, `Community 31`, `Community 32`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 27` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 24`, `Community 26`, `Community 29`, `Community 30`, `Community 31`, `Community 35`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `apiClient`, `CourseProgram`, `CourseSubject` to the rest of the system?**
  _264 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.027777777777777776 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0601404741000878 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06442307692307692 - nodes in this community are weakly interconnected._