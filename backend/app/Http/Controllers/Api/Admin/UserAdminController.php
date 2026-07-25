<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Domains\Core\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserAdminController extends \App\Http\Controllers\ApiController
{
    public function index(
        \App\Domains\Core\Requests\Admin\GetAdminUsersRequest $request,
        \App\Domains\Core\Actions\Admin\GetAdminUsersAction $action
    ) {
        $users = $action->execute($request->all());
        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'total' => $users->total(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
            ],
        ]);
    }

    public function store(
        \App\Domains\Core\Requests\Admin\StoreAdminUserRequest $request,
        \App\Domains\Core\Actions\Admin\StoreAdminUserAction $action
    ) {
        $user = $action->execute($request->validated());
        return response()->json(['data' => $user], 201);
    }

    public function update(
        \App\Domains\Core\Requests\Admin\UpdateAdminUserRequest $request,
        \App\Domains\Core\Actions\Admin\UpdateAdminUserAction $action,
        int $id
    ) {
        $user = $action->execute($id, $request->validated());
        return $this->success($user);
    }

    public function destroy(
        \App\Domains\Core\Requests\Admin\DeleteAdminUserRequest $request,
        \App\Domains\Core\Actions\Admin\DeleteAdminUserAction $action,
        int $id
    ) {
        $action->execute($id);
        return $this->success(null, 'User deleted.');
    }

    public function toggleActive(
        \App\Domains\Core\Requests\Admin\ToggleAdminUserStatusRequest $request,
        \App\Domains\Core\Actions\Admin\ToggleAdminUserStatusAction $action,
        int $id
    ) {
        $user = $action->execute($id, $request->boolean('active'));
        return $this->success($user);
    }
}

