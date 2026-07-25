# Enterprise Database Design Package
**EduFlow SaaS Platform**

This document details the database architecture, schema definitions, indexing strategies, relationship models, and lifecycle standards.

---

## 🗺️ 1. Entity Relationship Design

Relationships between primary domains are mapped below:

```
+------------+       1:N       +------------+       1:N       +------------+
|   Users    | 🡢🡢🡢🡢🡢🡢🡢🡢🡢🡢🡢 |  Courses   | 🡢🡢🡢🡢🡢🡢🡢🡢🡢🡢🡢 |  Modules   |
+------------+                 +------------+                 +------------+
      │                              │                              │
      │ 1:N                          │ 1:N                          │ 1:N
      ▼                              ▼                              ▼
+------------+                 +------------+                 +------------+
|  Sessions  |                 |  Batches   |                 |  Lessons   |
+------------+                 +------------+                 +------------+
```

---

## 🗂️ 2. Database Dictionary (Core Modules)

### 1. `users` (Actor Accounts)

| Column | Type | Nullable | Key | Default | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **id** | BIGINT | No | PK | | Auto-incrementing primary key |
| **uuid** | CHAR(36) | No | UQ | | Globally unique identifier (UUIDv4) |
| **name** | VARCHAR(255) | No | | | User's full name |
| **email** | VARCHAR(255) | No | UQ | | Primary login address |
| **phone** | VARCHAR(20) | Yes | | | Mobile telephone number |
| **avatar_media_id** | BIGINT | Yes | FK | | References `media.id` (onDelete SET NULL) |
| **password** | VARCHAR(255) | No | | | Hashed password credentials |
| **role** | VARCHAR(50) | No | | 'student' | RoleEnum: `admin`, `teacher`, `student` |
| **status** | VARCHAR(50) | No | | 'active' | StatusEnum: `active`, `suspended`, `pending` |
| **theme** | VARCHAR(20) | No | | 'system' | ThemeEnum: `light`, `dark`, `system` |
| **last_login_at** | TIMESTAMP | Yes | | | Last login tracking |
| **deleted_at** | TIMESTAMP | Yes | | | Soft deletes tracking column |

*   **Indexes**: `INDEX(role)`, `INDEX(status)`, `INDEX(active)`

---

### 2. `courses` (Curriculum Folders)

| Column | Type | Nullable | Key | Default | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **id** | BIGINT | No | PK | | Auto-incrementing primary key |
| **uuid** | CHAR(36) | No | UQ | | Globally unique identifier (UUIDv4) |
| **title** | VARCHAR(255) | No | | | Course title |
| **slug** | VARCHAR(255) | No | UQ | | URL-safe slug |
| **description** | TEXT | Yes | | | Long description HTML / markdown |
| **teacher_id** | BIGINT | No | FK | | References `users.id` (onDelete RESTRICT) |
| **status** | VARCHAR(50) | No | | 'draft' | CourseStatusEnum: `draft`, `published`, `archived` |
| **visibility** | VARCHAR(50) | No | | 'private'| VisibilityEnum: `public`, `private`, `batch_only` |
| **deleted_at** | TIMESTAMP | Yes | | | Soft deletes tracking column |

*   **Indexes**: `INDEX(teacher_id)`, `INDEX(status)`, `INDEX(visibility)`

---

### 3. `media` (Central Media Repository)

| Column | Type | Nullable | Key | Default | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **id** | BIGINT | No | PK | | Auto-incrementing primary key |
| **uuid** | CHAR(36) | No | UQ | | Globally unique identifier (UUIDv4) |
| **type** | VARCHAR(50) | No | | | Media Type: `video`, `document`, `image`, `audio` |
| **provider** | VARCHAR(50) | No | | | Provider: `local`, `s3`, `r2`, `youtube` |
| **storage_path** | VARCHAR(555) | No | | | Storage path / relative URI |
| **mime** | VARCHAR(100) | Yes | | | MIME content type |
| **size** | BIGINT | Yes | | | File size in bytes |
| **duration** | INT | Yes | | | Audio/Video playback duration in seconds |

*   **Indexes**: `INDEX(type)`, `INDEX(provider)`

---

### 4. `lessons` (Syllabus Items)

| Column | Type | Nullable | Key | Default | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **id** | BIGINT | No | PK | | Auto-incrementing primary key |
| **module_id** | BIGINT | No | FK | | References `course_modules.id` (onDelete CASCADE)|
| **title** | VARCHAR(255) | No | | | Lesson display title |
| **primary_media_id**| BIGINT | Yes | FK | | References `media.id` (onDelete SET NULL) |
| **download_media_id**| BIGINT | Yes | FK | | References `media.id` (onDelete SET NULL) |
| **sort_order** | INT | No | | 0 | Sorting order sequence weight |

---

## 🪙 3. Enum Catalog

We use database enums or strict string-constraints to restrict allowed state values:

*   **UserRole**: `admin`, `teacher`, `student`
*   **CourseStatus**: `draft`, `published`, `archived`
*   **Visibility**: `public`, `private`, `batch_only`
*   **MediaProvider**: `local`, `s3`, `r2`, `youtube`
*   **LessonType**: `video`, `live`, `quiz`, `notes`

---

## 📈 4. Indexing & Optimization Strategy

1.  **ForeignKey Constraints**: Every FK relationship requires an explicit index (e.g. `INDEX(module_id)` on `lessons`) to optimize sub-query evaluations.
2.  **Unique Keys**: String-based slugs (`courses.slug`) and UUID values (`users.uuid`) must be declared UNIQUE for fast O(1) query lookups.
3.  **Composite Indices**: Batch metrics track combination checks (e.g., composite key on `user_id` and `lesson_id` inside progress counters).

---

## 🔄 5. Data Lifecycle & Retention Policies

-   **Soft Deletes**: Primary models (Users, Courses, Lessons) leverage Laravel's `SoftDeletes` traits. Deleting records updates the `deleted_at` timestamp rather than purging data.
-   **Purge Window**: Soft-deleted records are automatically hard-purged from the database after a 90-day grace retention window.
-   **Audit Logs**: Activity tracking entries (`activity_logs`) are compressed and archived to cold file storage quarterly to optimize index sizes.
