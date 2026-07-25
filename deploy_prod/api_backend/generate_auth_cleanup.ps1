# PowerShell script to clean up remaining inline validations

# 1. AuthController
$baseDir = "c:\Dev\Projects\Online Tuition\backend\app\Domains\Core"
$reqDir = "$baseDir\Requests\Auth"
New-Item -ItemType Directory -Force -Path $reqDir | Out-Null
Set-Content -Path "$reqDir\LoginRequest.php" -Value '<?php namespace App\Domains\Core\Requests\Auth; use App\Http\Requests\ApiFormRequest; class LoginRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["email" => "required|email", "password" => "required", "device_name" => "required|string|max:100", "push_token" => "nullable|string"]; } }'
Set-Content -Path "$reqDir\ForgotPasswordRequest.php" -Value '<?php namespace App\Domains\Core\Requests\Auth; use App\Http\Requests\ApiFormRequest; class ForgotPasswordRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["email" => "required|email"]; } }'
Set-Content -Path "$reqDir\ResetPasswordRequest.php" -Value '<?php namespace App\Domains\Core\Requests\Auth; use App\Http\Requests\ApiFormRequest; class ResetPasswordRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["token" => "required", "email" => "required|email", "password" => "required|confirmed|min:8"]; } }'
Set-Content -Path "$reqDir\UpdateProfileRequest.php" -Value '<?php namespace App\Domains\Core\Requests\Auth; use App\Http\Requests\ApiFormRequest; class UpdateProfileRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["first_name" => "sometimes|required|string|max:50", "last_name" => "sometimes|required|string|max:50", "phone" => "nullable|string|max:20"]; } }'
Set-Content -Path "$reqDir\UpdatePasswordRequest.php" -Value '<?php namespace App\Domains\Core\Requests\Auth; use App\Http\Requests\ApiFormRequest; class UpdatePasswordRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["current_password" => "required|string", "new_password" => "required|string|min:8|confirmed"]; } }'
Set-Content -Path "$reqDir\UploadAvatarRequest.php" -Value '<?php namespace App\Domains\Core\Requests\Auth; use App\Http\Requests\ApiFormRequest; class UploadAvatarRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["avatar" => "required|image|max:5120"]; } }'
Set-Content -Path "$reqDir\RegisterDeviceRequest.php" -Value '<?php namespace App\Domains\Core\Requests\Auth; use App\Http\Requests\ApiFormRequest; class RegisterDeviceRequest extends ApiFormRequest { public function authorize(): bool { return true; } public function rules(): array { return ["device_name" => "required|string|max:100", "push_token" => "nullable|string"]; } }'

# 2. Re-write AuthController.php
Set-Content -Path "c:\Dev\Projects\Online Tuition\backend\app\Http\Controllers\Api\AuthController.php" -Value '<?php
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
    public function login(LoginRequest $request) {
        $user = User::where("email", $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) return $this->error("Invalid credentials", 401);
        if (!$user->active) return $this->error("Account is disabled", 403);
        $token = $user->createToken($request->device_name)->plainTextToken;
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
        return $this->success(null, "Password reset link sent (simulated)");
    }
    public function resetPassword(ResetPasswordRequest $request) {
        return $this->success(null, "Password reset successfully");
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
}'

Write-Host "AuthController refactored!"
