<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;

class AmenitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $amenities = [
            ['name' => 'Wi-Fi', 'slug' => 'wi-fi'],
            ['name' => 'Parking', 'slug' => 'parking'],
            ['name' => 'Pool', 'slug' => 'pool'],
            ['name' => 'Breakfast', 'slug' => 'breakfast'],
            ['name' => 'Air Conditioning', 'slug' => 'air-conditioning'],
            ['name' => 'Pet Friendly', 'slug' => 'pet-friendly'],
            ['name' => 'Restaurant', 'slug' => 'restaurant'],
            ['name' => 'Bar', 'slug' => 'bar'],
            ['name' => 'Airport Shuttle', 'slug' => 'airport-shuttle'],
            ['name' => 'Spa', 'slug' => 'spa'],
            ['name' => 'Beach Access', 'slug' => 'beach-access'],
            ['name' => 'Ocean View', 'slug' => 'ocean-view'],
            ['name' => 'Guided Tours', 'slug' => 'guided-tours'],
            ['name' => 'Snorkeling Gear', 'slug' => 'snorkeling-gear'],
            ['name' => 'Kayak Rental', 'slug' => 'kayak-rental'],
            ['name' => 'Wheelchair Accessible', 'slug' => 'wheelchair-accessible'],
            ['name' => 'Laundry', 'slug' => 'laundry'],
            ['name' => '24-Hour Front Desk', 'slug' => '24-hour-front-desk'],
            ['name' => 'Family Friendly', 'slug' => 'family-friendly'],
            ['name' => 'Eco Friendly', 'slug' => 'eco-friendly'],
        ];

        foreach ($amenities as $amenity) {
            Amenity::firstOrCreate(
                ['slug' => $amenity['slug']],
                ['name' => $amenity['name']],
            );
        }
    }
}
