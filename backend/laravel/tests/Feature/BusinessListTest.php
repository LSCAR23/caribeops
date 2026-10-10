<?php

namespace Tests\Feature;

use App\Models\Business;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessListTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The explicit BusinessResource keys every list item must expose.
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

    public function test_business_list_returns_paginated_resource_collection(): void
    {
        $this->seed(CategorySeeder::class);
        Business::factory()->create(['name' => 'D2-29 Visible Seeded Business']);
        Business::factory()->count(19)->create();

        $this->getJson('/api/businesses')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['*' => self::BUSINESS_KEYS],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ])
            ->assertJsonPath('meta.total', 20)
            ->assertJsonPath('meta.per_page', 15)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonFragment(['name' => 'D2-29 Visible Seeded Business']);
    }

    public function test_business_list_second_page_holds_remaining_records(): void
    {
        $this->seed(CategorySeeder::class);
        Business::factory()->count(20)->create();

        $response = $this->getJson('/api/businesses?page=2')
            ->assertOk()
            ->assertJsonPath('meta.current_page', 2);

        $this->assertCount(5, $response->json('data'));
    }
}
