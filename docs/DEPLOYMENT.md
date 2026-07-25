# Deployment & Migration Procedures
**EduFlow SaaS Platform**

---

## 🚀 Production Deployment Sequence

Follow this step-by-step procedure to execute safe production updates:

### 1. Pre-Release Warm-up
- Validate environment variables inside `.env` configuration file (DB credentials, SMTP, Firebase keys, local/S3 uploads path).
- Compile static production assets:
  ```bash
  npm run build
  ```

### 2. Live Application Migration
- Lock the deployment gate and place app in maintenance mode:
  ```bash
  php artisan down --secret="secret-maintenance-token"
  ```
- Execute database migrations:
  ```bash
  php artisan migrate --force
  ```
- Re-warm route and config caches:
  ```bash
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  ```

### 3. Queue Workers Startup
- Restart supervisor queue workers (to unload old models code from system memory):
  ```bash
  php artisan queue:restart
  ```

### 4. Release Validation & Warm-up
- Confirm health check endpoint `/up` resolves with a `200` OK status.
- Take application out of maintenance mode:
  ```bash
  php artisan up
  ```

---

## ⏪ Rollback Action Plan

If critical telemetry errors or exceptions occur post-deployment:
1.  Initiate maintenance gate: `php artisan down`
2.  Restore the latest daily SQL snapshot from database backups path.
3.  Roll back migrations to preceding stable commit hash:
    ```bash
    php artisan migrate:rollback --step=1
    ```
4.  Clear cached states: `php artisan cache:clear`
5.  Re-open the gateway: `php artisan up`
