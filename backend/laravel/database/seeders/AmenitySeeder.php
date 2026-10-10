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
        ];

        foreach ($amenities as $amenity) {
            Amenity::firstOrCreate(
                ['slug' => $amenity['slug']],
                ['name' => $amenity['name']],
            );
        }
    }
}
