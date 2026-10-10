<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_creation_with_invalid_fields_returns_422_and_persists_nothing(): void
    {
        $this->seed(CategorySeeder::class);

        $payload = [
            'category_id' => 999999,
            'description' => 'Invalid payload for D2-31 verification.',
            'type' => 'Boutique hotel',
            'address' => '123 Invalid St, Santo Domingo',
            'latitude' => 91,
            'longitude' => -181,
            'website' => 'not-a-url',
        ];

        $this->postJson('/api/businesses', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'category_id',
                'name',
                'latitude',
                'longitude',
                'website',
                'phone',
            ]);

        $this->assertDatabaseCount('businesses', 0);
    }

    public function test_business_update_with_invalid_fields_returns_422_and_keeps_original_values(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $business = Business::factory()->create(['name' => 'D2-31 Original Name']);

        $payload = [
            'category_id' => $categoryId,
            'description' => $business->description,
            'type' => $business->type,
            'address' => $business->address,
            'latitude' => (float) $business->latitude,
            'longitude' => (float) $business->longitude,
            'website' => 'not-a-url',
            'phone' => $business->phone,
        ];

        $this->putJson("/api/businesses/{$business->id}", $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'website']);

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
            'name' => 'D2-31 Original Name',
            'type' => $business->type,
            'phone' => $business->phone,
        ]);
    }
}
