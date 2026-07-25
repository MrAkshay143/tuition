# Operations Runbook
**EduFlow SaaS Platform**

---

## 🛠️ Queue Monitoring & Workers Management

EduFlow uses background job workers to handle video transcoding (`videos`), FCM notifications, and analytical snapshot compilations.

### Supervisor Configurations
To ensure workers remain active in background:
```ini
[program:eduflow-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_loglevel=info
```

### Worker Health Commands
- Monitor active queues depth size:
  ```bash
  php artisan queue:monitor database:default,database:videos
  ```
- Inspect failed jobs:
  ```bash
  php artisan queue:failed
  ```
- Retry failed operations:
  ```bash
  php artisan queue:retry all
  ```

---

## 💾 Disaster Recovery & Backups

### Automated DB Backups
Configure a cron scheduler task running daily:
```bash
mysqldump -u [user] -p[pass] eduflow_db | gzip > /var/backups/db/db_backup_$(date +%F).sql.gz
```

### Storage Directory Backups
Sync media uploads to remote storage (e.g. Amazon S3 or R2):
```bash
aws s3 sync /var/www/html/storage/app/public s3://eduflow-backups/media/ --delete
```
