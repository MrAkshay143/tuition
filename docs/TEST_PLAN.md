# QA Scenarios & Test Plan
**EduFlow SaaS Platform**

---

## 🧪 Staging Test Scenarios

### 1. Global Theme Engine Validation
*   **Test Case**: Switch theme on the public landing page.
    *   *Expectation*: Root class matches (e.g. `<html class="dark">` or `<html class="light">`) and CSS custom variables swap instantly without flaring white space or layout shifts.
*   **Test Case**: Set theme to `'system'`.
    *   *Expectation*: System matchMedia is resolved. Swapping prefers-color-scheme on macOS/Windows swaps the theme automatically.
*   **Test Case**: Logged-in theme update.
    *   *Expectation*: Toggle theme in student settings. Query client posts to `PUT /auth/theme` and updates database record. Loading profile on other devices fetches and renders user settings theme.

### 2. Curriculum Streaming & Transcoding
*   **Test Case**: Upload lesson video.
    *   *Expectation*: Background queue job `ProcessVideoJob` begins, transcodes raw source to HLS streams, captures poster frame thumbnails, and marks the video status as active.

### 3. Exam Auto-Grading Checks
*   **Test Case**: Submit MCQ exam responses.
    *   *Expectation*: Action evaluates selections against the correct option key, updates student performance logs, and checks certificate eligibility.
