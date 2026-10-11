<?php

namespace Tests\Feature;

use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoriesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The explicit CategoryResource keys every category item must expose.
     *
     * @var list<string>
     */
    private const array CATEGORY_KEYS = [
        'id',
        'name',
        'slug',
    ];

    public function test_categories_returns_seeded_collection_ordered_by_name(): void
    {
        $this->seed(CategorySeeder::class);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonStructure(['data' => ['*' => self::CATEGORY_KEYS]])
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.name', 'Hotels')
            ->assertJsonPath('data.1.name', 'Restaurants')
            ->assertJsonPath('data.2.name', 'Tours')
            ->assertJsonFragment(['slug' => 'hotels'])
            ->assertJsonFragment(['slug' => 'restaurants'])
            ->assertJsonFragment(['slug' => 'tours']);
    }
}
