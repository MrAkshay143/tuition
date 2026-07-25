<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\ApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
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
        
        return $this->success(["token" => $token, "user" => $user], "Login successful");
    }
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        return $this->success(null, "Logged out successfully");
    }
    public function me(Request $request) {
        return $this->success($request->user()->load("batches"), "Profile retrieved successfully");
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
                ])->save();

                event(new \Illuminate\Auth\Events\PasswordReset($user));
            }
        );

        return $status === \Illuminate\Support\Facades\Password::PASSWORD_RESET
            ? $this->success(null, __($status))
            : $this->error(__($status), 400);
    }
    public function updateProfile(UpdateProfileRequest $request) {
        $user = $request->user();
        $user->update($request->validated());
        return $this->success($user, "Profile updated successfully");
    }
    public function updatePassword(UpdatePasswordRequest $request) {
        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) return $this->error("Current password incorrect", 400);
        $user->update(["password" => Hash::make($request->new_password)]);
        return $this->success(null, "Password updated successfully");
    }
    public function uploadAvatar(UploadAvatarRequest $request) {
        $user = $request->user();
        $path = $request->file("avatar")->store("avatars", "public");
        $user->update(["avatar_url" => "/storage/" . $path]);
        return $this->success(["avatar_url" => $user->avatar_url], "Avatar updated successfully");
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
        return $this->success(['url' => url('/api/v1/auth/google/callback')], "Redirect URL generated");
    }
    public function handleGoogleCallback(Request $request) {
        return $this->error("Social authentication is not configured for local environment.", 501);
    }
}
