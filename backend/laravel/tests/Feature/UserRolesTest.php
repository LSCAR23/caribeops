<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRolesTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_in_each_role_persist_correctly(): void
    {
        foreach (['admin', 'owner', 'viewer'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->assertSame($role, $user->role);
            $this->assertDatabaseHas('users', [
                'id' => $user->id,
                'role' => $role,
            ]);
        }
    }

    public function test_factory_default_role_is_viewer(): void
    {
        $user = User::factory()->create();

        $this->assertSame('viewer', $user->role);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'viewer',
        ]);
    }
}
