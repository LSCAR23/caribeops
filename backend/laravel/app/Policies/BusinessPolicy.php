<?php

namespace App\Policies;

use App\Models\Business;
use App\Models\User;

class BusinessPolicy
{
    /**
     * Determine whether the user can create businesses.
     */
    public function create(User $user): bool
    {
        return $user->role !== 'viewer';
    }

    /**
     * Determine whether the user can update the business.
     */
    public function update(User $user, Business $business): bool
    {
        return $user->role !== 'viewer';
    }

    /**
     * Determine whether the user can delete the business.
     */
    public function delete(User $user, Business $business): bool
    {
        return $user->role !== 'viewer';
    }
}
