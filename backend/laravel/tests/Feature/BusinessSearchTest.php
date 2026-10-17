<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_list_searches_by_name(): void
    {
        $this->seed(CategorySeeder::class);
        Business::factory()->create(['name' => 'Alpha Hotel']);
        Business::factory()->create(['name' => 'Beta Tours']);

        $this->getJson('/api/businesses?search=alpha')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alpha Hotel');
    }

    public function test_business_list_search_is_case_insensitive(): void
    {
        $this->seed(CategorySeeder::class);
        Business::factory()->create(['name' => 'Alpha Hotel']);
        Business::factory()->create(['name' => 'Beta Tours']);

        $this->getJson('/api/businesses?search=ALPHA')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alpha Hotel');
    }

    public function test_business_list_search_with_no_match_returns_empty(): void
    {
        $this->seed(CategorySeeder::class);
        Business::factory()->create(['name' => 'Alpha Hotel']);

        $this->getJson('/api/businesses?search=zzz-no-match')
            ->assertOk()
            ->assertJsonPath('meta.total', 0)
            ->assertJsonCount(0, 'data');
    }

    public function test_business_list_search_combines_with_category_filter(): void
    {
        $this->seed(CategorySeeder::class);
        $hotels = Category::query()->where('slug', 'hotels')->firstOrFail();
        $tours = Category::query()->where('slug', 'tours')->firstOrFail();

        Business::factory()->for($hotels)->create(['name' => 'Alpha Hotel']);
        Business::factory()->for($tours)->create(['name' => 'Alpha Lodge']);

        $this->getJson("/api/businesses?search=alpha&category={$hotels->slug}")
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alpha Hotel');
    }
}
