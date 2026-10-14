<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_belongs_to_its_owner(): void
    {
        $this->seed(CategorySeeder::class);
        $owner = User::factory()->create(['role' => 'owner']);
        $business = Business::factory()->for($owner, 'user')->create();

        $this->assertTrue($business->user->is($owner));
        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
            'user_id' => $owner->id,
        ]);
    }

    public function test_owner_has_many_businesses(): void
    {
        $this->seed(CategorySeeder::class);
        $owner = User::factory()->create(['role' => 'owner']);
        Business::factory()->for($owner, 'user')->count(2)->create();

        $this->assertCount(2, $owner->businesses);
        $this->assertDatabaseCount('businesses', 2);
    }

    public function test_deleting_owner_nulls_business_user_id(): void
    {
        $this->seed(CategorySeeder::class);
        $owner = User::factory()->create(['role' => 'owner']);
        $business = Business::factory()->for($owner, 'user')->create();

        $owner->delete();

        $this->assertDatabaseHas('businesses', [
            'id' => $business->id,
            'user_id' => null,
        ]);
    }
}
