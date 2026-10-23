<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewCreationTest extends TestCase
{
    use RefreshDatabase;

    private const string UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

    /**
     * The explicit ReviewResource keys the created comment must expose.
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
    private function validPayload(): array
    {
        return [
            'rating' => 5,
            'title' => 'D7-30 Great coffee',
            'content' => 'D7-30 The best flat white on the island.',
        ];
    }

    public function test_authenticated_user_can_comment_on_business(): void
    {
        $this->seed(CategorySeeder::class);
        $business = Business::factory()->create();
        $user = User::factory()->create();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($user),
        ])->postJson("/api/businesses/{$business->id}/reviews", $this->validPayload())
            ->assertCreated()
            ->assertJsonStructure(['data' => self::REVIEW_KEYS])
            ->assertJsonPath('data.business_id', $business->id)
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.title', 'D7-30 Great coffee')
            ->assertJsonPath('data.content', 'D7-30 The best flat white on the island.')
            ->assertJsonPath('data.review_date', now()->toDateString());

        $this->assertDatabaseCount('reviews', 1);
        $this->assertDatabaseHas('reviews', [
            'business_id' => $business->id,
            'title' => 'D7-30 Great coffee',
        ]);
    }

    public function test_viewer_role_can_comment(): void
    {
        $this->seed(CategorySeeder::class);
        $business = Business::factory()->create();
        $viewer = User::factory()->create(['role' => 'viewer']);

        // D7-30 decision D1: commenting is content, not business management,
        // so viewers (denied business CRUD by BusinessPolicy) may still comment.
        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($viewer),
        ])->postJson("/api/businesses/{$business->id}/reviews", $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('data.business_id', $business->id);

        $this->assertDatabaseCount('reviews', 1);
    }

    public function test_anonymous_comment_returns_401(): void
    {
        $this->seed(CategorySeeder::class);
        $business = Business::factory()->create();

        $this->postJson("/api/businesses/{$business->id}/reviews", $this->validPayload())
            ->assertUnauthorized();

        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_missing_fields_return_422(): void
    {
        $this->seed(CategorySeeder::class);
        $business = Business::factory()->create();
        $user = User::factory()->create();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($user),
        ])->postJson("/api/businesses/{$business->id}/reviews", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rating', 'title', 'content']);

        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_rating_out_of_range_returns_422(): void
    {
        $this->seed(CategorySeeder::class);
        $business = Business::factory()->create();
        $user = User::factory()->create();

        $payload = $this->validPayload();
        $payload['rating'] = 6;

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($user),
        ])->postJson("/api/businesses/{$business->id}/reviews", $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rating']);

        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_unknown_business_uuid_returns_404(): void
    {
        $user = User::factory()->create();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($user),
        ])->postJson('/api/businesses/'.self::UNKNOWN_UUID.'/reviews', $this->validPayload())
            ->assertNotFound();

        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_non_uuid_business_segment_returns_404(): void
    {
        $user = User::factory()->create();

        // whereUuid fallthrough: the route never matches, middleware never runs.
        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($user),
        ])->postJson('/api/businesses/abc/reviews', $this->validPayload())
            ->assertNotFound();

        $this->assertDatabaseCount('reviews', 0);
    }
}
