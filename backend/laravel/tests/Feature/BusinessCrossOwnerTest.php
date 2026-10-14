<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessCrossOwnerTest extends TestCase
{
    use RefreshDatabase;

    private function login(User $user): string
    {
        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        return $token;
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(string $categoryId, string $name = 'Cross Owner Business'): array
    {
        return [
            'category_id' => $categoryId,
            'name' => $name,
            'description' => 'Cross-owner verification payload.',
            'type' => 'Boutique hotel',
            'address' => '123 Owner St, Santo Domingo',
            'latitude' => 18.4861,
            'longitude' => -69.9312,
            'website' => 'https://example.com/cross-owner',
            'phone' => '+1-809-555-0150',
        ];
    }

    public function test_owner_can_update_own_business(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $owner = User::factory()->create(['role' => 'owner']);
        $business = Business::factory()->for($owner, 'user')->create();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($owner),
        ])->putJson("/api/businesses/{$business->id}", $this->validPayload($categoryId, 'Updated Own Name'))
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Own Name');

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
            'name' => 'Updated Own Name',
        ]);
    }

    public function test_owner_cannot_update_another_owners_business(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $ownerA = User::factory()->create(['role' => 'owner']);
        $ownerB = User::factory()->create(['role' => 'owner']);
        $business = Business::factory()->for($ownerB, 'user')->create(['name' => 'Original Name']);

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($ownerA),
        ])->putJson("/api/businesses/{$business->id}", $this->validPayload($categoryId, 'Hijacked Name'))
            ->assertForbidden();

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
            'name' => 'Original Name',
        ]);
    }

    public function test_owner_cannot_delete_another_owners_business(): void
    {
        $this->seed(CategorySeeder::class);
        $ownerA = User::factory()->create(['role' => 'owner']);
        $ownerB = User::factory()->create(['role' => 'owner']);
        $business = Business::factory()->for($ownerB, 'user')->create();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($ownerA),
        ])->deleteJson("/api/businesses/{$business->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
        ]);
    }

    public function test_owner_can_delete_own_business(): void
    {
        $this->seed(CategorySeeder::class);
        $owner = User::factory()->create(['role' => 'owner']);
        $business = Business::factory()->for($owner, 'user')->create();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($owner),
        ])->deleteJson("/api/businesses/{$business->id}")
            ->assertNoContent();

        $this->assertDatabaseCount('businesses', 0);
    }

    public function test_admin_can_update_another_owners_business(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $admin = User::factory()->create(['role' => 'admin']);
        $owner = User::factory()->create(['role' => 'owner']);
        $business = Business::factory()->for($owner, 'user')->create();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($admin),
        ])->putJson("/api/businesses/{$business->id}", $this->validPayload($categoryId, 'Admin Updated Name'))
            ->assertOk();

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
            'name' => 'Admin Updated Name',
        ]);
    }

    public function test_post_assigns_creator_as_owner(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $owner = User::factory()->create(['role' => 'owner']);

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($owner),
        ])->postJson('/api/businesses', $this->validPayload($categoryId))
            ->assertCreated();

        $this->assertDatabaseHas('businesses', [
            'name' => 'Cross Owner Business',
            'user_id' => $owner->id,
        ]);
    }

    public function test_post_rejects_client_supplied_user_id(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $owner = User::factory()->create(['role' => 'owner']);
        $other = User::factory()->create(['role' => 'owner']);

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($owner),
        ])->postJson('/api/businesses', $this->validPayload($categoryId) + ['user_id' => $other->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);

        $this->assertDatabaseCount('businesses', 0);
    }
}
