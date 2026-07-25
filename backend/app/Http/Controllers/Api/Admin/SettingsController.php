<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\ApiController;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends ApiController
{
    public function index()
    {
        $defaults = [
            'platform_name' => 'EduFlow',
            'platform_url' => config('app.url'),
            'platform_logo_url' => '',
            'favicon_url' => '',
            'default_timezone' => '(UTC+05:30) Asia/Kolkata',
            'date_format' => 'DD MMM YYYY (22 Jul 2026)',
            'time_format' => '12 Hour (02:30 PM)',
            'default_language' => 'English',
            'site_footer_text' => '© 2026 EduFlow. All rights reserved.',
            'google_analytics_id' => 'G-XXXXXXXXXX',
            'smtp_host' => 'smtp.gmail.com',
            'smtp_port' => '587',
            'smtp_user' => 'notifications@eduflow.in',
            'smtp_password' => '••••••••••••',
            'smtp_from' => 'noreply@eduflow.in',
            'smtp_from_name' => 'EduFlow Platform',
            'smtp_encryption' => 'TLS',
            'notify_email' => 'true',
            'notify_push' => 'true',
            'notify_inapp' => 'true',
            'notify_live_class' => 'true',
            'notify_assignments' => 'true',
            'storage_provider' => 'local',
            'max_upload_size_mb' => '100',
            'allowed_file_types' => 'pdf,mp4,zip,png,jpg,doc',
            'force_2fa' => 'false',
            'password_min_length' => '8',
            'session_timeout_min' => '60',
            'failed_login_lockout' => '5',
        ];

        $current = Setting::allKeyed();
        $merged = array_merge($defaults, $current);

        return $this->success($merged);
    }

    public function update(Request $request)
    {
        $data = $request->all();

        foreach ($data as $key => $value) {
            if ($value !== null) {
                Setting::set($key, is_array($value) ? json_encode($value) : (string) $value);
            }
        }

        return response()->json([
            'message' => 'Platform settings updated successfully.',
            'data' => array_merge([
                'platform_name' => 'EduFlow',
                'platform_url' => config('app.url'),
            ], Setting::allKeyed())
        ]);
    }
}

