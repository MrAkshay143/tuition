# EduFlow Enterprise - Core Backend API ⚡

[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![Security](https://img.shields.io/badge/Security-Sanctum_%7C_Zero_Trust-22C55E?style=for-the-badge&logo=springsecurity&logoColor=white)](https://laravel.com/docs/sanctum)
[![Testing](https://img.shields.io/badge/Tests-100%25_Passing-3B82F6?style=for-the-badge&logo=phpunit&logoColor=white)](https://phpunit.de)

> **EduFlow Enterprise Backend** is a high-performance, Domain-Driven RESTful API engine powered by **Laravel 11** and **PHP 8.4**. It serves as the secure core for three unified portals (Admin Control Center, Teacher Workspace, and Student PWA), providing enterprise-grade security, real-time WebRTC signaling, dynamic analytics telemetry, and automated database backup infrastructure.

---

## 🏛️ Architecture & Domain-Driven Design (DDD)

The codebase follows a clean, decoupled **Domain-Driven Design (DDD)** pattern located under `app/Domains/`, isolating core business logic into scalable domain modules:

```
app/
 ├── Domains/
 │    ├── Assessment/   # Exams, Assignments, Submissions, Security Logs & Certificates
 │    ├── CMS/          # Blogs, Achievements & Portal Content Management
 │    ├── Core/         # Sanctum Session Binding, User Security & Activity Logging
 │    ├── Course/       # Curriculum Taxonomy, Programs, Subjects, Modules & Lessons
 │    ├── Engagement/   # Live Classes, Announcements, Notifications & WebRTC Signaling
 │    └── Media/        # Polymorphic Media Library & Video Streaming Lifecycle
 ├── Http/
 │    ├── Controllers/  # Dedicated V1 API & Admin Endpoint Controllers
 │    └── Middleware/   # ValidateSessionBinding, Permission Guard & Role Enforcement
 └── Support/           # Global Telemetry, Query Parsers, Constants & Base Models
```

---

## 🔒 Enterprise Security & Zero-Trust Features

* **Session Binding & Concurrency Control (`ValidateSessionBinding`)**:
  Enforces strict device authorization. Each login generates a cryptographic `UserSession` footprint. Admin revocation instantly invalidates active Sanctum tokens across distributed clients.
* **Exam Anti-Cheat Telemetry**:
  Tracks tab switching (`visibilitychange`), full-screen exits, context menu overrides, and clipboard activity in real-time via `POST /api/v1/student/exams/{id}/security-log`. Auto-submits exams upon exceeding security violation thresholds.
* **Role-Based Access Control (RBAC)**:
  Fine-grained permission matrices (`permission:exam.view`, `permission:dashboard.view`, etc.) powered by Spatie Permission integration.
* **Automated Session Cleanup**:
  Background scheduled jobs (`CleanupExpiredSessionsJob`) prune abandoned device sessions and expired tokens automatically.

---

## 📡 Live Telemetry & WebRTC Calling

* **Dynamic API Analytics**:
  Zero hardcoded numbers or mock data. Controllers dynamically compute active student metrics, 30-day user growth percentages, attendance ratios, and system error rates directly from live database queries.
* **WebRTC Video/Audio Signaling**:
  Integrated `ChatSignalingController` and LiveKit provider support enable instant 1-on-1 peer video and audio calling with URL-parameterized ICE candidate signaling (`POST /api/v1/chat/signal/{partnerId}`) and Firebase Cloud Messaging (FCM) silent push wakeup notifications.

---

## 💾 Shared-Hosting Compatible Backup Engine

* **Pure PHP PDO Database Generator**:
  Designed specifically for high-security cPanel and Hostinger shared environments where raw terminal calls (`exec`, `shell_exec`, `mysqldump`) are restricted.
* **Memory-Efficient Streaming**:
  Uses Laravel database cursor streaming (`DB::table()->cursor()`) to export multi-megabyte SQL tables without exhausting PHP memory limits or triggering gateway timeouts.

---

## 🛠️ Requirements & Quick Start

### Prerequisites
* **PHP >= 8.4** (with PDO, cURL, OpenSSL, mbstring, XML, and ZIP extensions)
* **Composer >= 2.x**
* **MySQL >= 8.0** or **SQLite 3**

### Installation & Setup

1. **Install Dependencies**:
   ```bash
   composer install --no-dev --optimize-autoloader
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Database Migration & Seeding**:
   Run the comprehensive production seeder to populate core taxonomy, demo accounts, courses, exams, and settings:
   ```bash
   php artisan migrate:fresh --seed --force
   ```

4. **Launch Local Development Server**:
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

---

## 🧪 Testing & Verification

The backend includes a comprehensive automated test suite verifying route integrity, permission matrices, session binding, and API parity:

```bash
# Execute full test suite
php artisan test

# Verify refactored admin & bundle API endpoints return HTTP 200 OK
php artisan test --filter VerifyRefactoredApisTest
```

---

## 📄 License & Ownership
Copyright © 2026 EduFlow Enterprise. All rights reserved. Developed and maintained for high-performance online tuition operations.
