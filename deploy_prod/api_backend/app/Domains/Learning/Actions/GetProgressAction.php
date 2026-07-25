<?php

namespace App\Domains\Learning\Actions;

use App\Domains\Core\Models\User;
use App\Domains\Learning\Models\CourseCompletion;
use Illuminate\Database\Eloquent\Collection;

class GetProgressAction
{
    public function execute(User $user): Collection
    {
        return CourseCompletion::where('user_id', $user->id)
            ->with(['course'])
            ->get();
    }
}
