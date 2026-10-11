<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Review;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_summary_returns_exact_aggregates(): void
    {
        $this->seed(CategorySeeder::class);

        $recentA = Business::factory()->create();
        $recentB = Business::factory()->create();
        Business::factory()->create(['created_at' => now()->subDays(30)]);

        Review::factory()->create(['business_id' => $recentA->id, 'rating' => 5]);
        Review::factory()->create(['business_id' => $recentA->id, 'rating' => 3]);
        Review::factory()->create(['business_id' => $recentB->id, 'rating' => 4]);

        $this->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonStructure(['data' => [
                'total_businesses',
                'total_reviews',
                'average_rating',
                'new_businesses',
            ]])
            ->assertJsonPath('data.total_businesses', 3)
            ->assertJsonPath('data.total_reviews', 3)
            ->assertJsonPath('data.average_rating', 4)
            ->assertJsonPath('data.new_businesses', 2);
    }

    public function test_dashboard_summary_handles_empty_database(): void
    {
        $this->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.total_businesses', 0)
            ->assertJsonPath('data.total_reviews', 0)
            ->assertJsonPath('data.average_rating', null)
            ->assertJsonPath('data.new_businesses', 0);
    }
}
