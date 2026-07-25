# Contributing to EduFlow Enterprise 🚀

Thank you for your interest in contributing to **EduFlow Enterprise**! Whether you are reporting bugs, improving documentation, or proposing new features for our digital classroom platform, we welcome high-quality contributions from the community and enterprise developers.

---

## 📋 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all maintainers and contributors with respect and professionalism.

---

## 🛠️ Development Setup

EduFlow Enterprise is split into two core layers: a **Laravel 11 REST API backend** and a **React 19 / Vite PWA frontend**.

### 1. Clone the Repository
```bash
git clone https://github.com/MrAkshay143/tuition.git
cd tuition
```

### 2. Backend Setup (`/backend`)
```bash
cd backend
cp .env.example .env
composer install --no-dev
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

### 3. Frontend Setup (`/frontend`)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## 🧪 Testing & Verification Standards

Before submitting a Pull Request, you **MUST** verify that all automated tests and production builds pass cleanly without warnings or errors.

### Backend Certification:
Run the PHPUnit / Pest automated test suite to ensure V1 API and Admin route parity:
```bash
cd backend
php artisan test
```
*All 60+ tests must return `PASS`.*

### Frontend Certification:
Run the TypeScript type checker and Vite production bundle generator:
```bash
cd frontend
npm run build
```
*Must complete with 0 TypeScript compilation errors and 0 asset bundle failures.*

---

## 🌿 Branching & Pull Request Workflow

1. **Fork & Branch**: Create a descriptive feature branch from `main` (e.g., `feat/webrtc-audio-toggle` or `fix/backup-pdo-timeout`).
2. **Commit Cleanly**: Use conventional commit messages:
   * `feat: ...` for new features
   * `fix: ...` for bug fixes
   * `docs: ...` for documentation improvements
   * `refactor: ...` for code refactoring
3. **Strict Git Rules**:
   * **NEVER** commit live `.env`, `.deploy.env`, or secret credentials.
   * **NEVER** commit test scratch scripts (`*.py`, `*.ps1`, `test_*.php`).
   * **NEVER** commit compiled `node_modules/`, `vendor/`, or `dist/` directories.
4. **Submit Pull Request**: Provide clear context, screenshots of UI changes (if applicable), and link any relevant issue IDs.

---

## 💡 Questions & Support
For architectural or enterprise deployment inquiries, contact **contact@imakshay.in** or visit our live platform at [tuition.imakshay.in](https://tuition.imakshay.in).
