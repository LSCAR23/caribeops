<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessCategoryFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_list_filters_by_category_id(): void
    {
        $this->seed(CategorySeeder::class);
        $hotels = Category::query()->where('slug', 'hotels')->firstOrFail();
        $tours = Category::query()->where('slug', 'tours')->firstOrFail();

        Business::factory()->for($hotels)->create([
            'name' => 'D3-19 Hotels Business',
            'type' => 'Boutique hotel',
        ]);
        Business::factory()->for($tours)->create([
            'name' => 'D3-19 Tours Business',
            'type' => 'Snorkeling tour',
        ]);

        $this->getJson('/api/businesses')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $this->getJson("/api/businesses?category_id={$hotels->id}")
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'D3-19 Hotels Business')
            ->assertJsonPath('data.0.category_id', $hotels->id);
    }

    public function test_business_list_filter_with_unknown_category_returns_empty(): void
    {
        $this->seed(CategorySeeder::class);
        Business::factory()->create();

        $this->getJson('/api/businesses?category_id=00000000-0000-0000-0000-000000000000')
            ->assertOk()
            ->assertJsonPath('meta.total', 0)
            ->assertJsonCount(0, 'data');
    }
}
