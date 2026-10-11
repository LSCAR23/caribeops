<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Review;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessReviewsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The explicit ReviewResource keys every review item must expose.
     *
     * @var list<string>
     */
    private const array REVIEW_KEYS = [
        'id',
        'business_id',
        'rating',
        'title',
        'content',
        'review_date',
        'created_at',
        'updated_at',
    ];

    public function test_business_reviews_returns_shaped_collection_scoped_to_business(): void
    {
        $this->seed(CategorySeeder::class);
        $business = Business::factory()->create();
        Review::factory()->for($business)->create(['title' => 'D3-12 Visible Review One', 'rating' => 5]);
        Review::factory()->for($business)->create(['title' => 'D3-12 Visible Review Two', 'rating' => 4]);
        $other = Business::factory()->create();
        Review::factory()->for($other)->create(['title' => 'D3-12 Other Business Review']);

        $response = $this->getJson("/api/businesses/{$business->id}/reviews")
            ->assertOk()
            ->assertJsonStructure(['data' => ['*' => self::REVIEW_KEYS]])
            ->assertJsonFragment(['title' => 'D3-12 Visible Review One'])
            ->assertJsonFragment(['title' => 'D3-12 Visible Review Two'])
            ->assertJsonMissing(['title' => 'D3-12 Other Business Review']);

        $this->assertCount(2, $response->json('data'));
        $this->assertSame($business->id, $response->json('data.0.business_id'));
    }

    public function test_unknown_business_reviews_id_returns_404(): void
    {
        $this->getJson('/api/businesses/00000000-0000-0000-0000-000000000000/reviews')
            ->assertNotFound();
    }

    public function test_non_uuid_business_reviews_id_returns_404(): void
    {
        $this->getJson('/api/businesses/abc/reviews')
            ->assertNotFound();
    }
}
