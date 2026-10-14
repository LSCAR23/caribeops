<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_viewer_cannot_create_businesses(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $user = User::factory()->create(['role' => 'viewer']);

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->postJson('/api/businesses', [
            'category_id' => $categoryId,
            'name' => 'Viewer Created Business',
            'description' => 'Must not persist for the viewer role.',
            'type' => 'Boutique hotel',
            'address' => '123 Viewer St, Santo Domingo',
            'latitude' => 18.4861,
            'longitude' => -69.9312,
            'website' => 'https://example.com/viewer',
            'phone' => '+1-809-555-0140',
        ])->assertForbidden();

        $this->assertDatabaseCount('businesses', 0);
    }

    public function test_viewer_cannot_update_businesses(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $business = Business::factory()->create(['name' => 'Original Name']);
        $user = User::factory()->create(['role' => 'viewer']);

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->putJson("/api/businesses/{$business->id}", [
            'category_id' => $categoryId,
            'name' => 'Viewer Updated Name',
            'description' => $business->description,
            'type' => $business->type,
            'address' => $business->address,
            'latitude' => (float) $business->latitude,
            'longitude' => (float) $business->longitude,
            'website' => 'https://example.com/viewer-update',
            'phone' => $business->phone,
        ])->assertForbidden();

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
            'name' => 'Original Name',
        ]);
    }

    public function test_viewer_cannot_delete_businesses(): void
    {
        $this->seed(CategorySeeder::class);
        $business = Business::factory()->create();
        $user = User::factory()->create(['role' => 'viewer']);

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->deleteJson("/api/businesses/{$business->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
        ]);
    }
}
