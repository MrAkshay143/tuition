# Enterprise SaaS Implementation Rules
**EduFlow SaaS Platform**

---

## 🏗️ 1. General Implementation Principles

*   **Production-Ready Only**: Never commit mock APIs, draft placeholders, or demo/faked logic.
*   **Decoupled Domain Boundaries**: Respect App/Domains separation of concerns. Do not cross domain borders without explicit interfaces.
*   **Zero Duplication**: Do not duplicate business queries on the backend, or styling classes/components on the frontend.

---

## 🎛️ 2. Architecture Pipelines

### Backend Architecture
```
HTTP Request ➔ Request Validation ➔ DTO ➔ Action ➔ Service ➔ Repository (if needed) ➔ Model ➔ API Resource ➔ HTTP Response
```
- No database queries or operations inside controllers.
- No business logic inside Eloquent models.
- Implement database transactions where multiple writes occur.

### Frontend Architecture
- Strictly use the centralized CSS Design System tokens.
- Manage server state caches using TanStack Query.
- Use Zustand solely for local client UI states.
- No hardcoded text strings in page templates.

---

## 🎨 3. Theme, Responsive, & Accessibility

- **Theme Engine**: Complete styling coverage for Light, Dark, and System modes. No inline color codes.
- **Responsive Layouts**: Design layouts to scale seamlessly from Mobile/Tablet up to Desktop resolutions.
- **Accessibility (a11y)**: Conform to WCAG AA parameters, managing focus states and keyboard navigation.

---

## 🔒 4. Testing & Verification Gate

Before committing any feature:
1.  Verify production frontend build compile: `npm run build`
2.  Verify backend test suite compile: `php artisan test`
3.  Audit theme overrides, responsive scaling, and API payloads consistency.
