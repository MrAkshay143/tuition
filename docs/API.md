# API Specifications
**EduFlow SaaS Platform**

---

## 🔒 Authentication & Authorization

All authenticated routes use **Laravel Sanctum Bearer tokens** (`Authorization: Bearer <token>`). Stateful CSRF is disabled for API namespaces, maintaining stateless transaction structures.

---

## ➔ Core API Routes Outline

### 1. Authentication
*   `POST /api/v1/auth/login` - Returns user record and new Bearer Token.
*   `POST /api/v1/auth/logout` - Revokes Sanctum token.
*   `GET /api/v1/auth/me` - Returns authenticated user details (includes theme).
*   `PUT /api/v1/auth/theme` - Updates theme preference (`light`, `dark`, or `system`).

### 2. Dashboard Bundles
*   `GET /api/v1/bundle/student-dashboard` - Aggregates enrolled courses, active progress percentages, pending assignment worksheets, and upcoming live classes.
*   `GET /api/v1/bundle/dashboard` - Fetches teacher dashboard metrics.
*   `GET /api/v1/bundle/admin-overview` - Fetches admin platform usage metrics.

### 3. Public Exploration
*   `GET /api/v1/public/explore` - Returns all courses and details (used by landing pages).

---

## 📊 Request & Response Contract

Every endpoint must output our standard JSON wrap:

```json
{
  "success": true,
  "message": "Detail message.",
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 0
  },
  "errors": null
}
```
