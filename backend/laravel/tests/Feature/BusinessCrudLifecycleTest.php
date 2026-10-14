<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// D6-21 lifecycle guard: one row through POST → GET → PUT → GET →
// DELETE → GET-404, with database assertions at every step. Single
// operations are pinned elsewhere; this proves their interaction.
class BusinessCrudLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_crud_lifecycle(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $admin = User::factory()->create(['role' => 'admin']);

        $token = $this->postJson('/api/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $headers = ['Authorization' => 'Bearer '.$token];

        $payload = [
            'category_id' => $categoryId,
            'name' => 'Lifecycle Business',
            'description' => 'Row for the CRUD lifecycle guard.',
            'type' => 'Boutique hotel',
            'address' => '123 Lifecycle St, Santo Domingo',
            'latitude' => 18.4861,
            'longitude' => -69.9312,
            'website' => 'https://example.com/lifecycle',
            'phone' => '+1-809-555-0180',
        ];

        $id = $this->withHeaders($headers)
            ->postJson('/api/businesses', $payload)
            ->assertCreated()
            ->json('data.id');

        $this->assertDatabaseHas('businesses', [
            'id' => $id,
            'name' => 'Lifecycle Business',
            'user_id' => $admin->id,
        ]);

        $this->withHeaders($headers)
            ->getJson("/api/businesses/{$id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Lifecycle Business');

        $this->withHeaders($headers)
            ->putJson("/api/businesses/{$id}", [...$payload, 'name' => 'Lifecycle Renamed'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Lifecycle Renamed');

        $this->withHeaders($headers)
            ->getJson("/api/businesses/{$id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Lifecycle Renamed');

        $this->assertDatabaseHas('businesses', [
            'id' => $id,
            'name' => 'Lifecycle Renamed',
        ]);

        $this->withHeaders($headers)
            ->deleteJson("/api/businesses/{$id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('businesses', ['id' => $id]);

        $this->withHeaders($headers)
            ->getJson("/api/businesses/{$id}")
            ->assertNotFound();

        $this->assertDatabaseCount('businesses', 0);
    }
}
