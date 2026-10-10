<?php

namespace Tests\Feature;

use App\Models\Category;
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

        $this->postJson('/api/businesses', $payload)
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
}
