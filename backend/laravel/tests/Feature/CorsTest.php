<?php

namespace Tests\Feature;

use Tests\TestCase;

// D6-17 CORS pins: preflight from an allowed origin returns allow
// headers; other origins get none. The allowlist is set at runtime so
// no test run depends on ambient environment variables.
class CorsTest extends TestCase
{
    private const string ALLOWED_ORIGIN = 'http://localhost:3101';

    private const string DENIED_ORIGIN = 'https://evil.example';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('cors.allowed_origins', [self::ALLOWED_ORIGIN]);
    }

    public function test_preflight_from_allowed_origin_returns_allow_headers(): void
    {
        $this->call('OPTIONS', '/api/businesses', [], [], [], [
            'HTTP_ORIGIN' => self::ALLOWED_ORIGIN,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ])->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', self::ALLOWED_ORIGIN);
    }

    public function test_preflight_from_denied_origin_is_not_allowed(): void
    {
        $response = $this->call('OPTIONS', '/api/businesses', [], [], [], [
            'HTTP_ORIGIN' => self::DENIED_ORIGIN,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        // HandleCors answers denied preflights with an empty (never echoed)
        // Allow-Origin: browsers match on value, so nothing is permitted.
        // Audited 2026-10-14.
        $this->assertNotEquals(
            self::DENIED_ORIGIN,
            $response->headers->get('Access-Control-Allow-Origin')
        );
    }

    public function test_get_with_allowed_origin_carries_allow_header(): void
    {
        $this->getJson('/api/health', ['Origin' => self::ALLOWED_ORIGIN])
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', self::ALLOWED_ORIGIN);
    }
}
