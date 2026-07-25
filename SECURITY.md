# Security Policy — EduFlow Enterprise 🛡️

EduFlow Enterprise takes platform security, data integrity, and privacy seriously. As a private digital classroom processing student records, live examinations, and educator content, we implement defense-in-depth Zero-Trust architecture across our full stack.

---

## 🔒 Supported Versions

Only the latest stable production release on the `main` branch is actively supported with security patches and vulnerability remediation.

| Version | Supported | Status |
| ------- | --------- | ------ |
| 2.x (Current Production) | :white_check_mark: Yes | Actively maintained on `main` |
| < 2.0 | :x: No | End of Life / Unsupported |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within EduFlow Enterprise (either in the Laravel backend API or the React PWA frontend), please **DO NOT** open a public GitHub issue.

### Confidential Reporting Protocol:
1. Email your findings confidentially to **contact@imakshay.in** or open a private advisory on GitHub.
2. Include the following details:
   * Description of the vulnerability and impact.
   * Steps to reproduce the issue (proof-of-concept scripts or HTTP traces).
   * Affected endpoints, models, or UI components.
3. Our security team will acknowledge receipt within **24 hours** and provide a timeline for triage and patch release.
4. Responsible disclosures will be recognized in our security release notes.

---

## 🛡️ Core Security Architecture

### 1. Zero-Trust Session Binding (`ValidateSessionBinding`)
* Every authenticated user session generates a cryptographic token bound to the device footprint.
* Simultaneous logins from unauthorized devices trigger immediate session binding revocation, terminating all active Sanctum API tokens.

### 2. Examination Anti-Cheat Telemetry
* During live assessments, the frontend monitors tab switches (`visibilitychange`), full-screen exits, context menu invocations, and clipboard paste attempts.
* Real-time security events are logged to `exam_security_logs` in the database. Exceeding threshold limits automatically terminates and submits the assessment attempt.

### 3. Role-Based Access Control (RBAC)
* All backend API routes enforce strict Spatie Permission checks (`permission:exam.view`, `permission:dashboard.view`, etc.).
* Administrative actions (SQL backup generation, user deletion, system settings overrides) require verified admin credentials and audit logging.

### 4. Data Protection & Shared Hosting Safety
* Automated backups use pure PHP PDO streaming (`DB::table()->cursor()`) to avoid executing shell commands (`mysqldump`, `exec`, `shell_exec`), mitigating server-side command injection risks on shared hosting environments.
