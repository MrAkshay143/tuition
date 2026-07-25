import os
import sys
import subprocess
import paramiko
import zipfile
import shutil
import time

# Fix Windows encoding issue for Unicode characters
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Deployment configuration loaded from environment or .deploy.env

def load_deploy_env():
    """Load .deploy.env file if it exists (gitignored credentials file)."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.deploy.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ.setdefault(key.strip(), val.strip())

load_deploy_env()

HOST = os.environ.get('DEPLOY_HOST', '145.79.213.57')
PORT = int(os.environ.get('DEPLOY_PORT', '65002'))
USER = os.environ.get('DEPLOY_USER', 'u581617111')
PASS = os.environ.get('DEPLOY_PASS', 'Yourcart@2024')

if not PASS:
    print("ERROR: DEPLOY_PASS not set. Create a .deploy.env file or set the DEPLOY_PASS environment variable.")
    sys.exit(1)

REMOTE_BASE = "/home/u581617111/domains/tuition.imakshay.in/public_html"
PHP_BIN = "/opt/alt/php84/usr/bin/php"
COMPOSER_BIN = f"{PHP_BIN} /usr/local/bin/composer"

# ==============================================================================

def print_hdr(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60 + "\n")

def ssh_exec(ssh, cmd, show=True):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    if show and out:
        print(out)
    if show and err:
        print(err)
    if exit_status != 0 and show:
        print(f"Command failed (Code {exit_status}): {cmd}")
    return exit_status, out

# ==============================================================================
# SCRIPT EXECUTION
# ==============================================================================
if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(current_dir, "frontend")
    backend_dir = os.path.join(current_dir, "backend")
    dist_dir = os.path.join(frontend_dir, "dist")
    zip_path = os.path.join(current_dir, "tuition_deploy.zip")

    # ── Step 1: Build Frontend ──
    print_hdr("BUILDING FRONTEND")
    os.chdir(frontend_dir)
    if subprocess.call("npm run build", shell=True) != 0:
        print("Build failed. Aborting.")
        sys.exit(1)
    os.chdir(current_dir)

    # ── Step 2: Package Project (Zip) ──
    print_hdr("PACKAGING PROJECT (ZIP)")
    if os.path.exists(zip_path):
        try:
            os.remove(zip_path)
        except Exception:
            pass

    print("Creating tuition_deploy.zip...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add frontend dist
        for root, dirs, files in os.walk(dist_dir):
            for file in files:
                if file == '.htaccess':
                    continue
                fp = os.path.join(root, file)
                rp = os.path.relpath(fp, dist_dir)
                zipf.write(fp, rp)

        # Add images directory explicitly
        backend_images = os.path.join(backend_dir, "public", "images")
        if os.path.exists(backend_images):
            for root, dirs, files in os.walk(backend_images):
                for file in files:
                    fp = os.path.join(root, file)
                    rp = os.path.join("images", os.path.relpath(fp, backend_images))
                    zipf.write(fp, rp)

        # Add root .htaccess
        htaccess_content = """<IfModule mod_dir.c>
  DirectoryIndex index.html
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteRule ^index\.html$ - [L]

  # Serve backend images directly if available
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^images/(.*)$ api_backend/public/images/$1 [L]

  # Allow direct access to backend directory
  RewriteRule ^api_backend/(.*)$ - [L]

  # Route all non-file requests directly to index.html for SPA page refreshes
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^(.*)$ index.html [L]
</IfModule>"""
        zipf.writestr(".htaccess", htaccess_content)

        # Add Backend files (excluding vendor, node_modules, storage, tests)
        skip_dirs = {".git", ".idea", "node_modules", "vendor", "storage", "tests"}
        for root, dirs, files in os.walk(backend_dir):
            dirs[:] = [d for d in dirs if d not in skip_dirs]
            for file in files:
                if file.endswith(".zip") or file.endswith(".env.backup") or file == ".phpunit.result.cache" or file == ".env":
                    continue
                fp = os.path.join(root, file)
                rp = os.path.join("api_backend", os.path.relpath(fp, backend_dir))
                try:
                    zipf.write(fp, rp)
                except Exception:
                    pass

        # Add Production .env for backend
        prod_env_content = """APP_NAME="EduFlow"
APP_ENV=production
APP_KEY=base64:7RSfqcREdcjsXBH+03wp45kkVPhrho0DHDa7lV+PFEE=
APP_DEBUG=false
APP_URL="https://tuition.imakshay.in/api_backend/public"
FRONTEND_URL="https://tuition.imakshay.in"

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=u581617111_tuition
DB_USERNAME=u581617111_tuitionuser
DB_PASSWORD="EduFlow2026!SecureTuition#99"

SESSION_DRIVER=file
QUEUE_CONNECTION=sync
CACHE_STORE=file

SANCTUM_STATEFUL_DOMAINS=tuition.imakshay.in
SESSION_DOMAIN=.imakshay.in
"""
        zipf.writestr("api_backend/.env", prod_env_content)

    zip_size = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"Zip created successfully: {zip_path} ({zip_size:.2f} MB)")

    # ── Step 3: Connect SSH ──
    print_hdr("CONNECTING TO SERVER")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=30)
        sftp = ssh.open_sftp()
        print("  Connected Successfully!")
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    # ── Step 4: Verify Remote Path ──
    print(f"\n[Verifying remote directory: {REMOTE_BASE}...]")
    ssh_exec(ssh, f"mkdir -p {REMOTE_BASE}")
    
    # ── Step 4: Clean Old Frontend & Cache Files ──
    print("\n[Cleaning old frontend assets and cache...]")
    ssh_exec(ssh, f"rm -rf {REMOTE_BASE}/assets", show=False)
    ssh_exec(ssh, f"rm -f {REMOTE_BASE}/index.html", show=False)
    ssh_exec(ssh, f"rm -f {REMOTE_BASE}/sw.js {REMOTE_BASE}/registerSW.js {REMOTE_BASE}/workbox-*.js {REMOTE_BASE}/manifest.webmanifest", show=False)
    # We do NOT delete the entire api_backend directory because we want to preserve vendor (speeds up composer install) and storage.
    print("  Cleaned old static assets.")

    # ── Step 5: Upload Zip ──
    print("\n[Uploading package to server...]")
    remote_zip = f"{REMOTE_BASE}/tuition_deploy.zip"
    def progress_callback(transferred, total):
        percent = (transferred / total) * 100
        print(f"\rUploading: {percent:.1f}% ({transferred}/{total} bytes)", end="")
    
    sftp.put(zip_path, remote_zip, callback=progress_callback)
    print("\n  Upload complete.")

    # ── Step 6: Extract & Permissions ──
    print("\n[Extracting package and setting permissions...]")
    unzip_cmd = f"""
    cd {REMOTE_BASE} && \
    unzip -q -o tuition_deploy.zip && \
    rm tuition_deploy.zip && \
    chmod 755 {REMOTE_BASE} && \
    chmod 644 index.html .htaccess && \
    mkdir -p api_backend/storage/app/public && \
    mkdir -p api_backend/storage/framework/cache/data && \
    mkdir -p api_backend/storage/framework/sessions && \
    mkdir -p api_backend/storage/framework/views && \
    mkdir -p api_backend/storage/logs && \
    chmod -R 775 api_backend/storage api_backend/bootstrap/cache
    """
    ssh_exec(ssh, unzip_cmd, show=False)
    print("  Extraction and permission setup complete.")

    # ── Step 7: Post-Deploy Commands ──
    print("\n[Running composer and artisan post-deploy commands...]")
    backend_path = f"{REMOTE_BASE}/api_backend"

    tinker_db_fix = (
        "DB::statement(\\\"UPDATE courses SET thumbnail = REPLACE(thumbnail, 'http://localhost:8000', 'https://tuition.imakshay.in') WHERE thumbnail LIKE '%localhost:8000%'\\\"); "
        "DB::statement(\\\"UPDATE media SET path = REPLACE(path, 'http://localhost:8000', 'https://tuition.imakshay.in') WHERE path LIKE '%localhost:8000%'\\\");"
    )

    cmds = [
        f"cd {backend_path} && {COMPOSER_BIN} install --no-dev --optimize-autoloader",
        f"cd {backend_path} && {PHP_BIN} artisan config:clear",
        f"cd {backend_path} && {PHP_BIN} artisan route:clear",
        f"cd {backend_path} && {PHP_BIN} artisan view:clear",
        f"cd {backend_path} && {PHP_BIN} artisan cache:clear",
        f"cd {backend_path} && {PHP_BIN} artisan migrate --force",
        f"cd {backend_path} && {PHP_BIN} artisan db:seed --class=DatabaseSeeder --force",
        f'cd {backend_path} && {PHP_BIN} artisan tinker --execute="{tinker_db_fix}"',
        f"cd {backend_path} && {PHP_BIN} artisan config:cache",
        f"cd {backend_path} && {PHP_BIN} artisan route:cache"
    ]
    for cmd in cmds:
        label = cmd.split('&& ')[1] if '&& ' in cmd else cmd
        print(f"  Executing: {label.split('--execute')[0].strip()}...")
        ssh_exec(ssh, cmd)

    # ── Step 8: Post-Deploy Health Check ──
    print("\n[Running post-deploy health check...]")
    _, health_out = ssh_exec(
        ssh,
        "curl -s -o /dev/null -w '%{http_code}' https://tuition.imakshay.in/api_backend/public/api/v1/public/explore",
        show=False
    )
    health_code = health_out.strip()
    if health_code == '200':
        print(f"  API health check: HTTP {health_code} — OK")
    else:
        print(f"  WARNING: API health check returned HTTP {health_code} — verify manually!")

    sftp.close()
    ssh.close()
    
    try:
        if os.path.exists(zip_path):
            os.remove(zip_path)
    except Exception:
        pass

    print_hdr("DEPLOYMENT COMPLETE!")
    print("  Production Web App: https://tuition.imakshay.in")
    print("  Production API:     https://tuition.imakshay.in/api/v1/public/explore")
