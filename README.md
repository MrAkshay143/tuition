# EduFlow AI — Private Digital Classroom Platform

[![Live](https://img.shields.io/badge/Live-tuition.imakshay.in-6C63FF?style=for-the-badge&logo=vercel)](https://tuition.imakshay.in)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

> **EduFlow AI** is a full-stack, enterprise-grade private digital classroom and learning management system (LMS). It serves three distinct user roles — **Admin**, **Teacher**, and **Student** — through dedicated portals with real-time communication, advanced security, video streaming, assessment tools, and a complete academic lifecycle.

---

## Live Application

| URL | Description |
|-----|-------------|
| [tuition.imakshay.in](https://tuition.imakshay.in) | Production frontend (React SPA + PWA) |
| [tuition.imakshay.in/api_backend/public/api/v1](https://tuition.imakshay.in/api_backend/public/api/v1/health) | Laravel REST API |

---

## System Architecture

`mermaid
flowchart TD
    subgraph Public["Public Website"]
        HOME[Home / Courses / Blog / Gallery]
        AUTH[Login / Google OAuth / Reset Password]
    end
    subgraph Admin["Admin Portal /admin/*"]
        AO[Overview Dashboard] --- AU[User Management]
        AU --- AR[Roles & Permissions]
        AR --- AS[Platform Settings]
        AS --- AAnn[Announcements Blast]
        AAnn --- ABK[Backup & Restore]
        ABK --- ALG[Activity Logs]
        ALG --- ASec[Security Center]
        ASec --- ASess[Device Sessions]
        ASess --- ATax[Academic Taxonomy]
        ATax --- AMedia[Media Library]
        AMedia --- ACrs[Courses & Builder]
        ACrs --- AExam[Exams & Questions]
        AExam --- AAssign[Assignments]
        AAssign --- ALive[Live Classes]
    end
    subgraph Teacher["Teacher Portal /teacher/*"]
        TD[Dashboard] --- TS[Students]
        TS --- TB[Batches]
        TB --- TC[Course Builder]
        TC --- TM[Content Library]
        TM --- TLive[Live Classes]
        TLive --- TA[Assignments]
        TA --- TE[Exams]
        TE --- TQB[Question Bank]
        TQB --- TCert[Certificates]
        TCert --- TChat[Chat]
        TChat --- TAnn[Announcements]
        TAnn --- TCal[Calendar]
        TCal --- TAnal[Analytics]
    end
    subgraph Student["Student Portal /student/*"]
        SD[Dashboard] --- SC[My Courses]
        SC --- SV[Lesson Viewer]
        SV --- SLive[Live Classes]
        SLive --- SA[Assignments]
        SA --- SE[Exams]
        SE --- SP[Progress Tracker]
        SP --- SChat[Chat]
        SChat --- SCal[Calendar]
        SCal --- SCert[Certificates]
    end
    subgraph Backend["Laravel 11 API - auth:sanctum"]
        API[REST API v1] --- RBAC[Spatie RBAC]
        RBAC --- Session[Session Binding Middleware]
        Session --- RateLimit[Rate Limiting]
        RateLimit --- Queue[Jobs & Queues]
        Queue --- Notif[Notification Engine]
    end
    subgraph Data["MySQL 8.0 - Hostinger"]
        DB[(Database)] --- Storage[(File Storage)]
    end
    subgraph External["External Services"]
        Google[Google OAuth 2.0]
        Zoom[Zoom API]
        SMTP[SMTP Mail]
        FCM[FCM Push Notifications]
        YouTube[YouTube Embed]
        Vimeo[Vimeo Embed]
    end
    Public --> Backend
    Admin --> Backend
    Teacher --> Backend
    Student --> Backend
    Backend --> Data
    Backend --> External
`

---

## User Roles

EduFlow AI has **three distinct user roles**, each with a completely separate portal:

| Role | Portal | Access Level |
|------|--------|-------------|
| **Admin** | /admin/* | Full god-mode — all features, all data |
| **Teacher** | /teacher/* | Academic operations — students, courses, assessments |
| **Student** | /student/* | Learning — enrolled courses, exams, assignments |

---

## Admin Portal — Complete Feature Reference

The Admin is the platform owner with unrestricted access to all 15+ sub-sections.

### Overview Dashboard (/admin/overview)
- KPI cards: total users, active students, published courses, revenue, live sessions today
- Real-time charts: enrollment trends, completion rates, revenue graph
- System health: API status, database connection, storage usage
- Recent activity feed: latest logins, registrations, course activity

### User Management (/admin/users)
- Create, edit, deactivate, and permanently delete users across all roles
- Toggle active/inactive status per user
- Force logout any user across all devices simultaneously
- Reset passwords for any account
- View role assignments, device count, last login timestamp
- Bulk suspend / activate multiple users

### Roles & Permissions (/admin/roles)
- Full Spatie RBAC: view all roles with their permission sets
- Edit permission assignments per role with live checkbox UI
- Roles: dmin, 	eacher, student
- Permission gates: dashboard.view, student.view, atch.view, course.view, system.manage, ssignment.submit, xam.attempt, live_class.view

### Platform Settings (/admin/settings)
| Tab | Configurable Fields |
|-----|---------------------|
| General | Platform name, logo, timezone, default language |
| Branding | Theme colors, favicon, banner image |
| Integrations | Google Client ID, Google OAuth URL, API base URL |
| Mail | SMTP host, port, credentials, sender name & email |
| Notifications | FCM API key, push notification toggles |
| Security | Session TTL, max sessions per device, device trust policy |
| Storage | Upload size limits, media storage path, CDN base URL |

### Announcement Blast (/admin/announcements)
- Broadcast to: all users, specific roles, specific batches, or individual students
- Rich text content with priority levels: Normal, Important, Urgent
- Schedule future delivery
- Track delivery status and read counts
- Full CRUD for announcements

### Academic Taxonomy
Manage the educational hierarchy used across the platform:
- **Education Types** (/admin/education-types): e.g., School, Undergraduate, Postgraduate — full CRUD + soft delete + restore
- **Programs** (/admin/programs): Academic programs under education types — full CRUD + soft delete + restore
- **Subjects** (/admin/subjects): Subjects mapped to programs — full CRUD + soft delete + restore
- **Academic Sessions** (/admin/sessions): Academic year/term management — full CRUD + soft delete + restore

### Batch Management (/admin/batches)
- Create, edit, archive batches
- Bulk add/remove students from batches
- Assign/unassign courses to a batch
- Per-batch analytics: enrollment count, active students, completion rate

### Courses & Course Builder (/admin/courses)
- Full course lifecycle: create, edit, publish, archive, duplicate, restore
- **Drag-and-drop Course Builder** with module/lesson hierarchy
- Autosave on every change
- Course versioning: create named snapshots, restore any version
- Course import/export (JSON)
- Lock/unlock courses to prevent concurrent edits
- Per-course activity logs and publish history
- Lesson dependency enforcement (prerequisite lessons)

### Media Content Library (/admin/media)
- Upload videos (MP4 → HLS adaptive streaming), PDF notes, images, documents
- Embed YouTube and Vimeo videos with metadata
- Bulk: delete, publish, archive, categorize
- Recycle bin with file restore
- Per-file usage tracking across lessons
- HLS stream URL generation

### Assignment Management (/admin/assignments)
- Full CRUD for assignments
- View all student submissions across the platform
- Grade with score + written feedback
- Download submitted files

### Exams & Question Bank (/admin/exams, /admin/question-bank)
- Create exams: duration, marks, pass mark, attempt limits, question shuffle
- Global question bank: topics, difficulty (Easy/Medium/Hard), types (MCQ/True-False/Short Answer)
- Add questions from the bank or create inline
- View all student attempts with per-question analytics

### Live Classes (/admin/live-classes)
- Schedule Zoom-integrated sessions (title, batch, date/time, duration, link)
- Start and end sessions (status: scheduled → live → ended)
- Record and view student attendance
- View all historical sessions

### Security Center (/admin/security)
- Session policy management: max concurrent sessions, idle timeout, forced re-auth interval
- Per-user session policy override
- Block suspicious IPs, force global password resets, clear remember-me tokens

### Device Sessions (/admin/sessions)
- View every active session across all users: device, IP, browser, OS, last activity
- Revoke individual sessions or all sessions for a user
- Trust/untrust specific devices

### Activity Logs (/admin/logs)
- Full immutable audit trail: user, action type, model, old/new values diff, IP, User-Agent, timestamp
- Filter by user, role, action, IP, date range
- Export as CSV

### Backup & Restore (/admin/backup)
- On-demand database + media backup
- Backup history with file size and timestamps
- Restore from any previous backup
- Download backup archives
- CSV export: students, batches, assignments, exams, logs

### Platform Operations (/admin/operations)
- System details: PHP version, Laravel version, DB connection, queue status
- Clear: application, config, route, and view caches
- Health check endpoints: /health/live, /health/ready

---

## Teacher Portal — Complete Feature Reference

### Dashboard (/teacher/dashboard)
- Stats: total students, active batches, published courses, pending assignments
- Today's live class schedule
- Recent student submissions and activity
- Notification bell with unread count

### Students (/teacher/students, /teacher/students/:id)
- Paginated student list with search and batch/status filters
- **Student profile** deep-dive: courses, progress, assignment grades, exam results, device sessions, attendance
- Add new students, assign/remove from batches and courses
- Suspend, activate, force-logout, reset passwords, send push notifications

### Batches (/teacher/batches)
- Create and manage study batches
- Batch detail: student roster, assigned courses, bulk sync students

### Courses & Builder (/teacher/courses, /teacher/courses/:id/builder)
- Create courses with description, subject, program, free/paid toggle
- Drag-and-drop builder: add/reorder modules and lessons
- Per-lesson: title, video (upload / YouTube / Vimeo), PDF notes, free preview toggle
- Autosave, versioning, import/export, lesson prerequisites

### Content Library (/teacher/media, /teacher/videos, /teacher/notes)
- Upload and manage all media assets
- Separate views for Videos and Notes
- Asset Picker Drawer for reusing assets across lessons

### Live Classes (/teacher/live-classes)
- Schedule, start, and end Zoom sessions
- View attendance records per session

### Assignments (/teacher/assignments)
- Create assignments with due dates, marks, target batch/course
- Grade submissions with feedback and score

### Exams (/teacher/exams, /teacher/question-bank)
- Create and configure exams with timing and attempt rules
- Manage global question bank
- Review student attempts with full analytics

### Certificates (/teacher/certificates)
- View certificates auto-issued on course completion

### Announcements (/teacher/announcements)
- Create targeted announcements; view read receipts

### Chat (/teacher/chat)
- 1-on-1 messaging with students and admins
- Real-time polling (new messages every 5s, unread count every 15s)

### Calendar (/teacher/calendar)
- Monthly/weekly/daily: live classes, assignment due dates, exam schedules

### Analytics (/teacher/analytics)
- Course completion and drop-off analysis
- Student engagement scores
- Exam pass/fail and average score charts
- Assignment submission rates and grade distributions

### Settings & Profile (/teacher/settings, /teacher/profile)
- Profile, password, multi-device session management
- Theme (light/dark/system), notification preferences

---

## Student Portal — Complete Feature Reference

### Dashboard (/student/dashboard)
- Resume learning card (last lesson position)
- Overall progress ring (completion %)
- Today's live classes
- Pending assignments and upcoming exams
- Recent announcements

### My Courses (/student/courses)
- Enrolled courses with per-course completion percentage
- Filter: In Progress, Completed, Not Started

### Lesson Viewer (/student/courses/:courseId/lessons/:lessonId)
- Premium video player: HLS (self-hosted), YouTube API, Vimeo API
- Playback position synced to server in real time
- Offline-first: progress buffered in IndexedDB, synced on reconnect
- Mark lesson complete, bookmark lessons
- Module sidebar with completion indicators
- Prerequisite enforcement (lesson locked until dependencies met)

### Live Classes (/student/live-classes)
- View and join Zoom sessions for enrolled batches
- Attendance auto-recorded on join

### Notes (/student/notes)
- All PDF notes shared across enrolled courses and batches

### Assignments (/student/assignments)
- View tasks with due dates and status
- Submit with file upload
- View grades and teacher feedback

### Exams (/student/exams)
- View upcoming and completed exams
- **Exam-taking interface** (/student/exams/:id/take): countdown timer, auto-submit, MCQ/True-False/Short Answer, question flagging, question palette for navigation
- **Results page** (/student/exams/:id/result): score, pass/fail, per-question breakdown with correct answers

### Progress Tracker (/student/progress)
- Visual activity timeline, per-course progress bars, continue-learning shortcut

### Chat (/student/chat)
- 1-on-1 messaging with teachers and admin

### Calendar (/student/calendar)
- Live class schedule, assignment deadlines, exam dates

### Certificates (/student/certificates)
- Download PDF certificates for completed courses

### Settings & Profile (/student/settings, /student/profile)
- Profile, avatar, password change
- Device session management (view/revoke active sessions)
- Notification preferences, theme toggle

---

## Public Website Pages

| Route | Page |
|-------|------|
| / | Home — hero, features, course preview, testimonials |
| /about | About the institution |
| /courses | Public course listing with search/filter |
| /courses/:id | Course detail with free lesson preview |
| /live-classes | Upcoming live sessions |
| /study-materials | Public study resources |
| /results | Student results showcase |
| /testimonials | Student testimonials |
| /gallery | Photo gallery |
| /blog | Blog listing |
| /blog/:id | Blog detail |
| /faq | Frequently asked questions |
| /contact | Contact form |
| /privacy | Privacy Policy |
| /terms | Terms of Service |
| /refund | Refund Policy |

---

## Security Architecture

### Authentication
- **Laravel Sanctum** — token-based authentication for SPA and API
- **Google OAuth 2.0** — social login (endpoint configurable in Admin Settings)
- **Password hashing** — Hash::make() (bcrypt, cost factor 12) — no plaintext passwords
- **Signed reset tokens** — time-limited (60-minute TTL), HMAC-based

### Session & Device Security
- **Session Binding Middleware** — each token is bound to the creating device fingerprint; cross-device token reuse is rejected (HTTP 401)
- **Device Fingerprinting** — composite hash of User-Agent, Accept-Language, IP, and client UUID stored per session
- **Multi-device management** — users see all active sessions; can trust/revoke individually or all at once
- **Session Policies** — configurable: max concurrent sessions, idle TTL, forced re-auth interval
- **Remember-Me Token Rotation** — tokens rotate on every use (sliding expiry)
- **Trusted Device Registry** — trusted devices bypass step-up re-authentication

### Authorization (RBAC)
- **Spatie Laravel Permission** — fine-grained permission gates per API route
- Admin role bypasses all permission checks automatically
- Full permission management UI in Admin → Roles page

### Rate Limiting
- Login: 60 req/min per IP
- Forgot password: 5 req/min per IP

### Audit & Compliance
- Immutable activity log for every create/update/delete action
- Logs include: user, action, model, value diff, IP, User-Agent, timestamp
- Exportable as CSV from Admin Logs page

### Other Security Measures
- Eloquent ORM — parameterized queries prevent SQL injection
- Laravel output escaping — prevents XSS
- CORS restricted to production frontend domain
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options

---

## Technical Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | Core UI framework |
| TypeScript | 5.x | Static typing |
| Vite | 8.x | Build tool with HMR |
| TanStack Query | 5.x | Server state, caching, background refetch |
| React Router | 7.x | Client-side routing (3 independent portals) |
| Framer Motion | 12.x | Animations & page transitions |
| Zustand | 5.x | Global auth + theme state |
| React Hook Form + Zod | latest | Forms with schema validation |
| Recharts | 2.x | Analytics dashboards |
| Lucide React | latest | Icon library |
| vite-plugin-pwa | latest | PWA (offline, installable, service worker) |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| PHP | 8.2+ | Runtime |
| Laravel | 11 | REST API framework |
| Laravel Sanctum | 4.x | Token authentication |
| Spatie Permission | 6.x | RBAC permission system |
| MySQL | 8.0 | Relational database |

### Infrastructure
| Component | Provider |
|-----------|---------|
| Hosting | Hostinger (Shared cPanel) |
| Database | Hostinger MySQL 8.0 |
| SSL | Let's Encrypt (auto-renew) |
| File Storage | Local disk (/storage/app/public) |
| Email | SMTP (configurable) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Video Calls | Zoom Meeting API |
| OAuth | Google OAuth 2.0 |
| Video Embedding | YouTube + Vimeo Player APIs |

---

## Project Structure

`
Online Tuition/
├── backend/                          # Laravel 11 API
│   ├── app/
│   │   ├── Domains/                  # Domain-Driven Design modules
│   │   │   ├── AI/                   # AI assistance utilities
│   │   │   ├── Academic/             # Programs, subjects, taxonomy
│   │   │   ├── Analytics/            # Reporting & charts
│   │   │   ├── Assessment/           # Exams, questions, attempts
│   │   │   ├── CMS/                  # Blogs, achievements
│   │   │   ├── Certificate/          # Certificate generation
│   │   │   ├── Chat/                 # 1-on-1 messaging
│   │   │   ├── Communication/        # Announcements
│   │   │   ├── Core/                 # Users, auth, sessions
│   │   │   ├── Course/               # Courses, modules, lessons
│   │   │   ├── Engagement/           # Bookmarks, activity tracking
│   │   │   ├── Learning/             # Progress, history, resume
│   │   │   ├── LiveClass/            # Live sessions + Zoom
│   │   │   ├── Media/                # Uploads, HLS streaming
│   │   │   ├── Notification/         # Push & in-app notifications
│   │   │   ├── Search/               # Global full-text search
│   │   │   ├── Settings/             # Platform configuration
│   │   │   ├── Student/              # Student management
│   │   │   └── Teacher/              # Teacher management
│   │   ├── Http/Controllers/Api/     # REST controllers
│   │   ├── Http/Middleware/          # Session binding, active check
│   │   └── Http/Requests/            # Form request validation
│   ├── database/
│   │   ├── migrations/               # All schema migrations
│   │   └── seeders/                  # DatabaseSeeder + domain seeders
│   └── routes/api.php                # 100+ API route definitions
│
├── frontend/                         # React 19 + TypeScript SPA
│   ├── src/
│   │   ├── api/
│   │   │   ├── bundles/              # Single-call page bundle endpoints
│   │   │   ├── client.ts             # Axios instance + auth interceptors
│   │   │   └── resources/            # TanStack Query hooks per domain
│   │   ├── components/
│   │   │   ├── layout/               # AppShell, AdminShell, sidebars
│   │   │   ├── players/              # HLS, YouTube, Vimeo players
│   │   │   ├── security/             # Device session UI components
│   │   │   └── ui/                   # Button, Input, Table, Modal, etc.
│   │   ├── features/
│   │   │   ├── admin/                # 12 Admin portal pages
│   │   │   ├── analytics/            # Teacher analytics dashboard
│   │   │   ├── announcements/        # Announcement creation + feed
│   │   │   ├── assignments/          # Teacher + student assignment pages
│   │   │   ├── auth/                 # Login, forgot/reset password
│   │   │   ├── batches/              # Batch management + detail
│   │   │   ├── calendar/             # Teacher + student calendars
│   │   │   ├── certificates/         # Certificate views
│   │   │   ├── chat/                 # Real-time chat UI
│   │   │   ├── courses/              # Course builder + student viewer
│   │   │   ├── dashboard/            # Teacher + student dashboards
│   │   │   ├── exams/                # Exam builder + taking + results
│   │   │   ├── live-classes/         # Live class management
│   │   │   ├── media/                # Content library + asset picker
│   │   │   ├── notes/                # Student notes viewer
│   │   │   ├── profile/              # User profile editor
│   │   │   ├── settings/             # Preferences + security
│   │   │   └── students/             # Student management + profile
│   │   ├── lib/
│   │   │   ├── PlaybackController    # Video playback orchestration
│   │   │   ├── PlaybackEventBus      # Cross-component events
│   │   │   ├── ProgressManager       # Lesson progress sync engine
│   │   │   ├── SyncQueue             # Offline-first queue manager
│   │   │   └── playbackDB            # IndexedDB for offline progress
│   │   ├── pages/                    # Public website pages (17 pages)
│   │   ├── router/index.tsx          # React Router (5 route groups)
│   │   ├── store/                    # Zustand: auth + theme stores
│   │   └── types/index.ts            # Shared TypeScript interfaces
│   └── vite.config.ts
│
├── deploy.py                         # Automated SSH/SFTP deploy script
├── root.htaccess                     # Apache SPA rewrite rules
└── README.md
`

---

## Local Development

### Prerequisites
- Node.js 20+, PHP 8.2+, Composer 2+, MySQL 8.0, Python 3.9+

### Backend

`ash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configure DB_*, GOOGLE_*, MAIL_* in .env
php artisan migrate --seed
php artisan storage:link
php artisan serve
# API at http://localhost:8000/api/v1
`

### Frontend

`ash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_BACKEND_URL=http://localhost:8000/api/v1
npm run dev
# App at http://localhost:5173
`

### Default Seeded Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eduflow.test | Admin@1234! |
| Teacher | teacher@eduflow.test | Teacher@1234! |
| Student | student@eduflow.test | Student@1234! |

---

## Environment Variables

### Backend .env

`nv
APP_NAME="EduFlow AI"
APP_URL=https://tuition.imakshay.in
FRONTEND_URL=https://tuition.imakshay.in

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=your_database
DB_USERNAME=your_user
DB_PASSWORD=your_password

SANCTUM_STATEFUL_DOMAINS=tuition.imakshay.in

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://tuition.imakshay.in/api_backend/public/api/v1/auth/google/callback

MAIL_MAILER=smtp
MAIL_HOST=your_smtp_host
MAIL_PORT=587
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_password
MAIL_FROM_ADDRESS=no-reply@tuition.imakshay.in

FIREBASE_FCM_KEY=your_fcm_key
ZOOM_API_KEY=your_zoom_key
ZOOM_API_SECRET=your_zoom_secret
`

### Frontend .env.local

`nv
VITE_BACKEND_URL=https://tuition.imakshay.in/api_backend/public/api/v1
VITE_APP_NAME="EduFlow AI"
`

---

## Deploy to Hostinger

`ash
python deploy.py
`

The deploy script:
1. Builds the frontend (
pm run build)
2. Zips backend + frontend dist
3. Uploads via SFTP to Hostinger
4. Extracts to public_html
5. Runs composer install --no-dev
6. Runs php artisan migrate --force
7. Runs php artisan db:seed --class=DatabaseSeeder --force
8. Runs php artisan optimize

### Health Check

`ash
curl https://tuition.imakshay.in/api_backend/public/api/v1/health
# {"status":"ok"}
`

---

## License

Private repository — all rights reserved. Copyright 2024–2025 EduFlow AI / Mr. Akshay.
