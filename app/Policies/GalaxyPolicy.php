<?php

namespace App\Policies;

use App\Models\Galaxy;
use App\Models\User;

class GalaxyPolicy
{
    public function update(User $user, Galaxy $galaxy): bool
    {
        return $user->id === $galaxy->user_id;
    }

    public function delete(User $user, Galaxy $galaxy): bool
    {
        return $user->id === $galaxy->user_id;
    }
}
