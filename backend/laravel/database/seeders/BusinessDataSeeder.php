<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\Business;
use App\Models\Category;
use App\Models\Review;
use Illuminate\Database\Seeder;
use RuntimeException;

class BusinessDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $typesByCategory = [
            'hotels' => 'Boutique hotel',
            'restaurants' => 'Café',
            'tours' => 'Snorkeling tour',
        ];

        $categories = Category::query()
            ->whereIn('slug', array_keys($typesByCategory))
            ->get()
            ->keyBy('slug');

        if ($categories->count() !== count($typesByCategory)) {
            throw new RuntimeException('Seed the Hotels, Restaurants, and Tours categories before business data.');
        }

        $amenities = Amenity::query()->get();

        if ($amenities->isEmpty()) {
            throw new RuntimeException('Seed amenities before creating business data.');
        }

        $businesses = collect();

        foreach ($typesByCategory as $categorySlug => $type) {
            $businesses->push(
                Business::factory()
                    ->for($categories->get($categorySlug))
                    ->state(['type' => $type])
                    ->create(),
            );
        }

        $businesses = $businesses->merge(Business::factory()->count(37)->create());

        foreach ($businesses as $business) {
            $business->amenities()->attach(
                $amenities->random(fake()->numberBetween(1, 4))->modelKeys(),
            );

            Review::factory()
                ->count(8)
                ->for($business)
                ->create();
        }
    }
}
