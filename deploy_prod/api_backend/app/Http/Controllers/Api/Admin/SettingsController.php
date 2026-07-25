<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $defaults = [
            'platform_name' => 'EduFlow AI',
            'platform_url' => 'http://localhost',
            'platform_logo_url' => '',
            'favicon_url' => '',
            'default_timezone' => '(UTC+05:30) Asia/Kolkata',
            'date_format' => 'DD MMM YYYY (22 Jul 2026)',
            'time_format' => '12 Hour (02:30 PM)',
            'default_language' => 'English',
            'site_footer_text' => '© 2026 EduFlow AI. All rights reserved.',
            'google_analytics_id' => 'G-XXXXXXXXXX',
            'smtp_host' => 'smtp.gmail.com',
            'smtp_port' => '587',
            'smtp_user' => 'notifications@eduflow.ai',
            'smtp_password' => '••••••••••••',
            'smtp_from' => 'noreply@eduflow.ai',
            'smtp_from_name' => 'EduFlow AI Platform',
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

        return response()->json(['data' => $merged]);
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
                'platform_name' => 'EduFlow AI',
                'platform_url' => 'http://localhost',
            ], Setting::allKeyed())
        ]);
    }
}
