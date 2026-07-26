<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\ApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Domains\Core\Models\User;
use App\Domains\Core\Requests\Auth\LoginRequest;
use App\Domains\Core\Requests\Auth\ForgotPasswordRequest;
use App\Domains\Core\Requests\Auth\ResetPasswordRequest;
use App\Domains\Core\Requests\Auth\UpdateProfileRequest;
use App\Domains\Core\Requests\Auth\UpdatePasswordRequest;
use App\Domains\Core\Requests\Auth\UploadAvatarRequest;
use App\Domains\Core\Requests\Auth\RegisterDeviceRequest;

class AuthController extends ApiController {
    public function login(LoginRequest $request, \App\Domains\Core\Services\ConcurrentSessionService $concurrentSessionService, \App\Domains\Core\Services\SessionSecurityService $sessionSecurityService) {
        $user = User::where("email", $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) return $this->error("Invalid credentials", 401);
        if (!$user->active) return $this->error("Account is disabled", 403);
        
        $deviceId = $request->header('X-Device-ID') ?? $request->device_name ?? 'web';
        
        // Enforce concurrent session policies before creating token
        $concurrentSessionService->enforce($user, $request, $deviceId);

        $token = $user->createToken($deviceId)->plainTextToken;
        
        // Bind session
        $sessionSecurityService->bindSession($user, $request, $token);
        
        $user->permissions = $user->getAllPermissions()->pluck('name');
        
        return $this->success(["token" => $token, "user" => $user], "Login successful");
    }
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        return $this->success(null, "Logged out successfully");
    }
    public function me(Request $request) {
        $user = $request->user()->load("batches");
        $user->permissions = $user->getAllPermissions()->pluck('name');
        return $this->success($user, "Profile retrieved successfully");
    }
    public function forgotPassword(ForgotPasswordRequest $request) {
        $status = \Illuminate\Support\Facades\Password::sendResetLink(
            $request->only('email')
        );

        return $status === \Illuminate\Support\Facades\Password::RESET_LINK_SENT
            ? $this->success(null, __($status))
            : $this->error(__($status), 400);
    }
    public function resetPassword(ResetPasswordRequest $request) {
        $status = \Illuminate\Support\Facades\Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => \Illuminate\Support\Str::random(60),
                    'password_changed_at' => now(),
                ])->save();

                event(new \Illuminate\Auth\Events\PasswordReset($user));
            }
        );

        return $status === \Illuminate\Support\Facades\Password::PASSWORD_RESET
            ? $this->success(null, __($status))
            : $this->error(__($status), 400);
    }

    public function validateResetToken(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return $this->error('Invalid token or email', 400);
        }

        $isValid = \Illuminate\Support\Facades\Password::broker()->tokenExists($user, $request->token);
        if (!$isValid) {
            return $this->error('Invalid or expired reset token', 400);
        }

        return $this->success(['valid' => true], 'Token is valid');
    }
    public function updateProfile(UpdateProfileRequest $request) {
        $user = $request->user();
        $user->update($request->validated());
        return $this->success($user, "Profile updated successfully");
    }
    public function updatePassword(UpdatePasswordRequest $request) {
        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) return $this->error("Current password incorrect", 400);
        $user->update([
            "password" => Hash::make($request->new_password),
            "password_changed_at" => now()
        ]);
        return $this->success(null, "Password updated successfully");
    }

    public function registerDevice(RegisterDeviceRequest $request) {
        return $this->success(null, "Device registered successfully");
    }
    public function changePassword(UpdatePasswordRequest $request) {
        return $this->updatePassword($request);
    }
    public function updateTheme(Request $request) {
        $validated = $request->validate(['theme' => 'required|string|in:light,dark,system']);
        $user = $request->user();
        $user->update(['theme' => $validated['theme']]);
        return $this->success($user, "Theme updated successfully");
    }
    public function refresh(Request $request) {
        $user = $request->user();
        $token = $user->createToken('auth-refresh')->plainTextToken;
        return $this->success(['token' => $token, 'user' => $user], "Token refreshed successfully");
    }
    public function redirectToGoogle() {
        if (!config('services.google.client_id')) {
            return redirect('/login?error=SocialAuthNotConfigured');
        }
        return \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->redirect();
    }
    public function handleGoogleCallback(Request $request) {
        if (!config('services.google.client_id')) {
            return redirect('/login?error=SocialAuthNotConfigured');
        }
        try {
            $googleUser = \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->user();
            // In a full implementation, you would find/create the user and return a token
            // For now, redirect back with error since logic is missing
            return redirect('/login?error=GoogleAuthNotImplemented');
        } catch (\Exception $e) {
            return redirect('/login?error=GoogleAuthFailed');
        }
    }
}

