<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_anonymous_business_deletion_is_rejected(): void
    {
        $this->seed(CategorySeeder::class);
        $business = Business::factory()->create();

        $this->deleteJson("/api/businesses/{$business->id}")
            ->assertUnauthorized();

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
        ]);
    }

    public function test_authenticated_business_deletion_removes_record(): void
    {
        $this->seed(CategorySeeder::class);
        $business = Business::factory()->create();
        $user = User::factory()->create(['role' => 'admin']);

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->deleteJson("/api/businesses/{$business->id}")
            ->assertNoContent();

        $this->assertDatabaseCount('businesses', 0);
    }
}
