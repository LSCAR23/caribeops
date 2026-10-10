<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessNotFoundTest extends TestCase
{
    use RefreshDatabase;

    public function test_unknown_business_id_returns_404(): void
    {
        $this->getJson('/api/businesses/999999')
            ->assertNotFound();
    }

    public function test_non_numeric_business_id_returns_404(): void
    {
        $this->getJson('/api/businesses/abc')
            ->assertNotFound();
    }
}
