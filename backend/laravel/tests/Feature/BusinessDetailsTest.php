<?php

namespace Tests\Feature;

use App\Models\Amenity;
use App\Models\Business;
use App\Models\Category;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\AmenitySeeder;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessDetailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_detail_returns_owner_and_amenities(): void
    {
        $this->seed([CategorySeeder::class, AmenitySeeder::class]);

        $owner = User::factory()->create(['name' => 'Owner One']);
        $category = Category::query()->first();
        $amenities = Amenity::query()->take(3)->get();

        $business = Business::factory()->for($category)->create([
            'user_id' => $owner->id,
            'name' => 'Detail Test Business',
        ]);
        $business->amenities()->attach($amenities);

        $this->getJson("/api/businesses/{$business->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Detail Test Business')
            ->assertJsonPath('data.owner.name', 'Owner One')
            ->assertJsonPath('data.owner.email', $owner->email)
            ->assertJsonPath('data.amenities.0', $amenities->first()->name)
            ->assertJsonCount(3, 'data.amenities');
    }

    public function test_business_detail_returns_reviews(): void
    {
        $this->seed([CategorySeeder::class, AmenitySeeder::class]);

        $category = Category::query()->first();
        $business = Business::factory()->for($category)->create([
            'name' => 'Reviewed Business',
        ]);

        $business->reviews()->save(Review::factory()->make([
            'title' => 'Great place',
            'content' => 'Loved it',
            'rating' => 5,
        ]));

        $this->getJson("/api/businesses/{$business->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Reviewed Business')
            ->assertJsonCount(1, 'data.reviews')
            ->assertJsonPath('data.reviews.0.title', 'Great place');
    }

    public function test_business_detail_unknown_uuid_returns_404(): void
    {
        $this->getJson('/api/businesses/00000000-0000-0000-0000-000000000000')
            ->assertNotFound();
    }

    public function test_business_detail_without_owner_returns_null_owner(): void
    {
        $this->seed(CategorySeeder::class);

        $category = Category::query()->first();
        $business = Business::factory()->for($category)->create([
            'name' => 'Ownerless Business',
            'user_id' => null,
        ]);

        $this->getJson("/api/businesses/{$business->id}")
            ->assertOk()
            ->assertJsonPath('data.owner', null)
            ->assertJsonPath('data.name', 'Ownerless Business');
    }
}
