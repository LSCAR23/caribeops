<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Business>
 */
class BusinessFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $typesByCategory = [
            'hotels' => ['Boutique hotel', 'Hostel'],
            'restaurants' => ['Café', 'Seafood restaurant'],
            'tours' => ['Snorkeling tour', 'Guided tour'],
        ];

        $category = Category::query()
            ->whereIn('slug', array_keys($typesByCategory))
            ->inRandomOrder()
            ->firstOrFail();

        return [
            'category_id' => $category->id,
            'name' => fake()->company(),
            'description' => fake()->paragraph(),
            'type' => fake()->randomElement($typesByCategory[$category->slug]),
            'address' => fake()->address(),
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
            'website' => fake()->optional()->url(),
            'phone' => fake()->phoneNumber(),
        ];
    }
}
