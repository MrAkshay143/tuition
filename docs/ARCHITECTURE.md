# Technical Architecture Design
**EduFlow SaaS Platform**

---

## 🏗️ Domain-Driven Design (DDD Lite) Layout

The backend directory structure is separated into isolated domains under `app/Domains/`. Each domain encapsulates its specific business models, business workflows (Actions), core interfaces, and jobs:

```
app/Domains/
├── Core/             - Authentication, Batch mappings, and Activity Logs
├── Course/           - Course details, Modules, Lesson Syllabus, and Progress
├── Media/            - File uploading, Local/S3 storage drivers, and HLS transcoding
├── LiveClass/        - Schedules, zoom/google-meet integrations, and replays
├── Assessment/       - Assignment reviews and online MCQ auto-graded exams
├── Notification/     - Firebase FCM tokens and preferences
├── Chat/             - Direct student-teacher messaging
├── Settings/         - App name settings and key-value feature flags
└── Analytics/        - Daily snapshot compilation jobs
```

---

## ➔ Service & Action Decoupling Pattern

We avoid bloated models and generic repositories by segregating business logic using a strict single-action pipeline:

```
Controller (HTTP Route endpoint)
      ↓
Action (Single business entry-point, e.g. SubmitExamAttemptAction)
      ↓
Service (Utility helper modules, e.g. VideoPipelineService)
      ↓
Model (Eloquent DB mapping schema)
```

---

## 🛡️ Exception Handling & Response Wrapping

All API responses and exceptions are captured globally in `bootstrap/app.php` and rendered using the standardized JSON structure:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... },
  "meta": null,
  "errors": null
}
```
