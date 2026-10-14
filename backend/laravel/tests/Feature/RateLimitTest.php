<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// D6-18 rate-limit pins: the login brake trips exactly at the 11th
// attempt per email+IP, and public GETs carry the group throttle
// headers. No sleeps needed — the counter, not time, is asserted.
class RateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_allows_ten_attempts_then_returns_429(): void
    {
        for ($attempt = 1; $attempt <= 10; $attempt++) {
            $this->postJson('/api/login', [
                'email' => 'hammer@example.com',
                'password' => 'not-the-password',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/login', [
            'email' => 'hammer@example.com',
            'password' => 'not-the-password',
        ])->assertTooManyRequests()
            ->assertHeader('Retry-After');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_public_health_carries_group_throttle_headers(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertHeader('X-RateLimit-Limit');
    }

    public function test_public_reads_allow_sixty_then_return_429(): void
    {
        for ($request = 1; $request <= 60; $request++) {
            $this->getJson('/api/health')->assertOk();
        }

        $this->getJson('/api/health')
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');
    }
}
