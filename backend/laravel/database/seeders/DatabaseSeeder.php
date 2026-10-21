<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->call(CategorySeeder::class);
        $this->call(AmenitySeeder::class);
        $this->call(BusinessDataSeeder::class);

        // D7-27: optional high-volume synthetic dataset for development and
        // testing. Default off, so the deterministic demo counts
        // (3/20/40/320, docs/deterministic-demo-seed.md) stay pinned.
        if (filter_var(env('SEED_VOLUME', false), FILTER_VALIDATE_BOOL)) {
            $this->call(CaribbeanVolumeSeeder::class);
        }
    }
}
