<?php

namespace App\Policies;

use App\Models\Planet;
use App\Models\User;

class PlanetPolicy
{
    public function update(User $user, Planet $planet): bool
    {
        return $user->id === $planet->user_id;
    }

    public function delete(User $user, Planet $planet): bool
    {
        return $user->id === $planet->user_id;
    }
}
