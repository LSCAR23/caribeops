<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessCreationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The explicit BusinessResource keys the created business must expose.
     *
     * @var list<string>
     */
    private const array BUSINESS_KEYS = [
        'id',
        'category_id',
        'name',
        'description',
        'type',
        'address',
        'latitude',
        'longitude',
        'website',
        'phone',
        'created_at',
        'updated_at',
    ];

    public function test_business_creation_returns_resource_and_persists_record(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $user = User::factory()->create();

        $payload = [
            'category_id' => $categoryId,
            'name' => 'D2-30 Created Business',
            'description' => 'Created through the API boundary for D2-30 verification.',
            'type' => 'Boutique hotel',
            'address' => '123 Creation St, Santo Domingo',
            'latitude' => 18.4861,
            'longitude' => -69.9312,
            'website' => 'https://example.com/d2-30',
            'phone' => '+1-809-555-0130',
        ];

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->postJson('/api/businesses', $payload)
            ->assertCreated()
            ->assertJsonStructure(['data' => self::BUSINESS_KEYS])
            ->assertJsonPath('data.name', 'D2-30 Created Business')
            ->assertJsonPath('data.category_id', $categoryId)
            ->assertJsonPath('data.phone', '+1-809-555-0130');

        $this->assertDatabaseHas('businesses', [
            'name' => 'D2-30 Created Business',
            'category_id' => $categoryId,
            'phone' => '+1-809-555-0130',
        ]);
        $this->assertDatabaseCount('businesses', 1);
    }

    public function test_anonymous_business_creation_is_rejected(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;

        $this->postJson('/api/businesses', [
            'category_id' => $categoryId,
            'name' => 'Anonymous Business',
            'description' => 'Must not persist without authentication.',
            'type' => 'Boutique hotel',
            'address' => '123 Anonymous St, Santo Domingo',
            'latitude' => 18.4861,
            'longitude' => -69.9312,
            'website' => 'https://example.com/anonymous',
            'phone' => '+1-809-555-0199',
        ])->assertUnauthorized();

        $this->assertDatabaseCount('businesses', 0);
    }
}
