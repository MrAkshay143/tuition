# Enterprise Engineering Standards Manual
**EduFlow SaaS Platform Coding Constitution**

This manual defines the mandatory architecture patterns, coding standards, database schemas, deployment gates, and security rules for the EduFlow SaaS platform. Every contributor must follow these standards.

---

## 🏛️ 1. Architecture Decision Records (ADR)

### ADR-001: Backend Framework Selection
*   **Context**: The application requires robust routing, database migration, schema validation, and secure authentication out of the box.
*   **Decision**: Adopt Laravel 11 as the core backend platform.
*   **Alternatives Considered**: Node.js/Express (too lightweight, requires writing boilerplate), Spring Boot (overhead too high).
*   **Consequences**: Developer productivity is maximized, but execution speed is lower than Compiled runtimes.
*   **Trade-offs**: Trade execution speed for faster development time and standard modules.

### ADR-002: Frontend Framework Selection
*   **Context**: The student and teacher workspaces require dynamic, real-time UI components.
*   **Decision**: React 19 + Vite as the frontend compiler.
*   **Alternatives Considered**: Next.js (SSR overhead not justified for private dashboards), Vue (less ecosystem adoption for core modules).
*   **Consequences**: Fast builds via HMR, but requires client-side routing.
*   **Trade-offs**: Single-page application architecture requires careful bundle size budgeting.

### ADR-003: Architectural Style (DDD Lite)
*   **Context**: Large monorepos experience tight file coupling.
*   **Decision**: Segment code domains (Core, Course, Media) under `app/Domains/`.
*   **Alternatives Considered**: Full DDD (too verbose, requires complex data transfer mappings), standard MVC (leads to bloated classes).
*   **Consequences**: Code is highly maintainable, but developers must understand domain boundaries.
*   **Trade-offs**: Domain namespaces isolate folders while using Eloquent models directly to maintain productivity.

### ADR-004: State Management
*   **Context**: Need caching for server data and local UI state.
*   **Decision**: Use TanStack Query (React Query) for server caching, and Zustand for lightweight local states.
*   **Alternatives Considered**: Redux (unnecessary boilerplate).
*   **Consequences**: Automatic cache invalidation, minimal local state classes.
*   **Trade-offs**: Higher dependency footprint.

### ADR-005: Video Delivery Architecture
*   **Context**: Private course videos require security and responsive streaming.
*   **Decision**: Hybrid structure. Private videos use local FFMPEG transcoding to generate HLS segments. Public marketing clips use YouTube embeds.
*   **Alternatives Considered**: Native MP4 streaming (prone to bandwidth waste and piracy).
*   **Consequences**: High security and responsive playback, but increases backend CPU transcoding load.
*   **Trade-offs**: Transcoding requires background queue resources.

### ADR-006: Theme Engine
*   **Context**: The application must support Light, Dark, and System modes seamlessly across public and private panels.
*   **Decision**: Centralized CSS variables managed by a React `ThemeProvider` and persisted in both local storage and the database.
*   **Alternatives Considered**: Utility-based inline styling overrides.
*   **Consequences**: Consistent visual tokens across all layouts, no white flash on reload.
*   **Trade-offs**: Requires strict discipline to avoid inline color styling.

### ADR-007: Authentication Strategy
*   **Context**: Stateless API requests need secure, lightweight session verification.
*   **Decision**: Use Laravel Sanctum tokens.
*   **Alternatives Considered**: JWT tokens (difficult to invalidate instantly).
*   **Consequences**: Instant token invalidation via database lookup.
*   **Trade-offs**: Requires database check on each request (optimized via cache).

### ADR-008: Media Library Strategy
*   **Context**: Media uploads (avatars, thumbnails, notes PDFs) must be centrally managed and reusable.
*   **Decision**: Centralized `media` database table linked to abstract storage providers.
*   **Alternatives Considered**: Hardcoded file paths in individual models.
*   **Consequences**: Easy cleanup of orphan files, single media record can be reused across lessons and profiles.
*   **Trade-offs**: Requires joining the media table for file reads.

### ADR-009: Queue Architecture
*   **Context**: Long-running tasks (transcoding, notifications, reports) should not block HTTP responses.
*   **Decision**: Redis-backed asynchronous queues.
*   **Alternatives Considered**: Sync driver (blocks request thread), database driver (poor performance under load).
*   **Consequences**: Sub-second API responses for heavy operations.
*   **Trade-offs**: Requires running background Supervisor worker processes.

### ADR-010: API Design Philosophy
*   **Context**: Need uniform communication between frontend client and backend endpoints.
*   **Decision**: RESTful API design utilizing standard HTTP methods and a uniform JSON envelope.
*   **Alternatives Considered**: GraphQL (complex schema management and caching overhead).
*   **Consequences**: Predictable endpoints and standard error handling.
*   **Trade-offs**: Under-fetching or over-fetching in some edge views.

---

## 🛠️ 2. Engineering Principles

### Core Architecture Policies
1.  **SOLID**: Apply SRP to actions, OCP to providers, LSP to models, ISP to interfaces, and DIP to services.
2.  **DRY & KISS**: Do not duplicate query logic. Write readable code instead of complex single-line solutions.
3.  **YAGNI**: Build for current requirements, not hypothetical future needs.
4.  **Composition over Inheritance**: Use traits and interfaces rather than deep class inheritance hierarchies.
5.  **Clean Architecture**: Enforce strict separation of concerns between data, business, and presentation layers.

---

## 🏗️ 3. Backend Engineering Standards

### Mandatory Request Pipeline
Every API request must follow this flow:
```
HTTP Request ➔ Request Validation ➔ DTO ➔ Action ➔ Service ➔ Repository (if needed) ➔ Model ➔ API Resource ➔ HTTP Response
```

### Development Constraints
*   **No Controllers Business Logic**: Controllers must only receive inputs, dispatch to Actions, and return JSON responses.
*   **No Fat Models**: Models must only contain database mappings, relations, and local scopes. Move logic to Services.
*   **Decoupling**: Use Eloquent events to trigger secondary workflows (e.g., sending emails after signup).

---

## ⚛️ 4. Frontend Engineering Standards

*   **React 19 & TypeScript**: Every component must define a strict props interface. The use of `any` is strictly prohibited.
*   **Vite**: Frontend assets are compiled using Vite.
*   **Feature Modules**: Group page files under `src/features/<feature_name>/` (e.g., `src/features/auth/`).
*   **Zustand Stores**: Place client state stores under `src/store/`. Do not duplicate data between stores and API states.

---

## 🎨 5. Design System & Theme Engine

*   **Design Tokens**: Spacing, colors, and typography must use CSS variables defined in `index.css`.
*   **Global Theme Provider**: Every page must mount under the global `ThemeProvider`.
*   **Modes**: Full support for Light, Dark, and System modes. Components must automatically adapt using semantic utility variables (e.g., `bg-[rgb(var(--bg-surface))]`).

---

## 📝 6. CSS Standards

*   **No Hex Codes**: Raw hex codes (e.g. `#ffffff`) are not allowed inside components. Use CSS variables instead.
*   **Transitions**: Theme transitions must use a smooth duration (e.g., `transition-colors duration-250`).
*   **No Page-Specific Duplication**: Share common styles in the design system instead of writing page-level utility overrides.

---

## 💾 7. Database Standards

*   **Identifiers**: Primary keys must use `BIGINT UNSIGNED` auto-increment. UUIDs (CHAR(36)) are used for public API lookups.
*   **Foreign Keys**: Explicit indexes are required on all foreign key columns. Cascades must be defined: `onDelete('cascade')` for modules, `onDelete('restrict')` for core users.
*   **Soft Deletes**: Primary tables (users, courses, lessons) must implement the `SoftDeletes` trait.

---

## 📊 8. API Standards

*   **Versioning**: Prefix all routes with `/api/v1/`.
*   **Envelope Structure**: All responses must use this standardized wrap:
    ```json
    {
      "success": true,
      "message": "Resource fetched.",
      "data": [],
      "meta": null,
      "errors": null
    }
    ```
*   **Status Codes**: Use correct status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`, `500 Server Error`.

---

## 🔍 9. Error Handling & Exceptions

*   **Exceptions**: Define custom exceptions (e.g., `DomainException`) to return user-friendly messages and appropriate HTTP codes.
*   **Correlation IDs**: Append a unique request correlation ID to all log envelopes for easy debugging.

---

## 📋 10. Logging Standards

*   **Structured JSON Logs**: Logs must write structured context arrays:
    ```php
    Log::error('Transcoding failed', ['video_id' => $id, 'error' => $e->getMessage()]);
    ```
*   **PII Filtering**: Sanitize sensitive inputs (passwords, tokens, phone numbers) before writing to logs.

---

## 🛡️ 11. Security Standards

*   **Sanctum**: Bearer tokens authorize requests.
*   **Policies**: Restrict data access scopes using policies (e.g. `CoursePolicy`).
*   **Rate Limits**: Throttle API requests (e.g., max 60 requests per minute per IP).
*   **Secure Headers**: Enable secure headers (CSP, HSTS, X-Frame-Options) on the production web server.

---

## 🎥 12. Media & Video Pipeline

*   **Upload Validation**: Validate MIME types and restrict file sizes (e.g. Max 5MB for PDFs, 50MB for video lectures).
*   **FFmpeg Transcoding**: The background queue process `ProcessVideoJob` must transcode videos to multi-resolution HLS streams using local FFmpeg.

---

## ⚡ 13. Performance Budgets

*   **Bundle Budget**: Initial JS bundles must be under **350KB** (gzipped).
*   **API Latency**: DB-driven endpoints must resolve under **200ms**.
*   **Caching**: Cache static CMS variables and settings in Redis.

---

## ♿ 14. Accessibility (a11y)

*   **WCAG 2.2 AA**: All elements must support screen readers, correct ARIA attributes, focus rings, and high contrast ratios.
*   **Reduced Motion**: Respect prefers-reduced-motion queries inside CSS transition animations.

---

## 🌐 15. Internationalization (i18n)

*   **No Hardcoded Text**: Component labels must reference i18n translation keys.
*   **Formattings**: Numbers, currency, and dates must format dynamically using the client locale.

---

## 📦 16. Git Standards

*   **Branches**: Use git flow naming: `main`, `develop`, `feature/*`, `bugfix/*`.
*   **Conventional Commits**: Commit messages must follow: `type(scope): message`.
*   **Pull Requests**: Must link to target issues and confirm quality checks are complete.

---

## 🔍 17. Code Review Checklist

Reviewers must verify:
*   [ ] Request pipeline matches architecture standards
*   [ ] Unit and feature tests cover changes
*   [ ] No stubs, comments, or console logs remaining
*   [ ] Page renders correctly in light, dark, and mobile viewports
*   [ ] Accessibility check complete

---

## 🧪 18. Testing Standards

*   **PHPUnit**: Feature tests must cover core actions.
*   **Coverage Target**: Minimum **80% code coverage** for core domains.

---

## ⚙️ 19. DevOps & Deployment

*   **CI/CD**: Auto-run builds and test suites on merge requests to `develop` and `main` branches.
*   **Queue Workers**: Background supervisor processes must manage Laravel queue workers.

---

## 🏁 20. Release Stages Pipeline

The release pipeline follows this flow:
```
Development ➔ Feature Complete ➔ Internal QA ➔ RC-1 ➔ RC-2 ➔ Pre-Production ➔ Production ➔ Post-Release Monitoring
```

---

## 🔒 21. Quality Gates

A pull request cannot merge unless:
1.  All test runs pass.
2.  Vite production bundle builds cleanly.
3.  TypeScript type-check passes.
4.  Zero stubs, console logs, or TODO annotations exist.
