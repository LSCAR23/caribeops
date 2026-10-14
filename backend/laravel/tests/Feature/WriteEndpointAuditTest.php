<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// D6-16 audit pins: cells no other test proves. Observed behavior is
// pinned, not prescribed — if any of these fail with an insane status,
// that is a reported bug, not a test to rewrite.
class WriteEndpointAuditTest extends TestCase
{
    use RefreshDatabase;

    private const string UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

    private function login(User $user): string
    {
        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        return $token;
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(string $categoryId): array
    {
        return [
            'category_id' => $categoryId,
            'name' => 'Audit Payload Business',
            'description' => 'Payload for audit pins.',
            'type' => 'Boutique hotel',
            'address' => '123 Audit St, Santo Domingo',
            'latitude' => 18.4861,
            'longitude' => -69.9312,
            'website' => 'https://example.com/audit',
            'phone' => '+1-809-555-0170',
        ];
    }

    public function test_login_without_email_returns_422(): void
    {
        $this->postJson('/api/login', ['password' => 'password'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_without_password_returns_422(): void
    {
        $this->postJson('/api/login', ['email' => 'nobody@example.com'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_admin_put_unknown_uuid_returns_404(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($admin),
        ])->putJson('/api/businesses/'.self::UNKNOWN_UUID, $this->validPayload($categoryId))
            ->assertNotFound();

        $this->assertDatabaseCount('businesses', 0);
    }

    public function test_admin_delete_unknown_uuid_returns_404(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($admin),
        ])->deleteJson('/api/businesses/'.self::UNKNOWN_UUID)
            ->assertNotFound();
    }

    public function test_anonymous_put_unknown_uuid_returns_401(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;

        // Auth middleware runs before binding: anonymous callers get 401
        // without learning whether the id exists. Audited 2026-10-14.
        $this->putJson('/api/businesses/'.self::UNKNOWN_UUID, $this->validPayload($categoryId))
            ->assertUnauthorized();

        $this->assertDatabaseCount('businesses', 0);
    }

    public function test_anonymous_delete_unknown_uuid_returns_401(): void
    {
        $this->deleteJson('/api/businesses/'.self::UNKNOWN_UUID)
            ->assertUnauthorized();
    }

    public function test_admin_put_non_uuid_segment_returns_404(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $admin = User::factory()->create(['role' => 'admin']);

        // whereUuid fallthrough: the route never matches, middleware never runs.
        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($admin),
        ])->putJson('/api/businesses/abc', $this->validPayload($categoryId))
            ->assertNotFound();

        $this->assertDatabaseCount('businesses', 0);
    }

    public function test_admin_delete_non_uuid_segment_returns_404(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($admin),
        ])->deleteJson('/api/businesses/abc')
            ->assertNotFound();
    }

    public function test_patch_without_route_returns_405(): void
    {
        $this->seed(CategorySeeder::class);
        $categoryId = Category::query()->where('slug', 'hotels')->firstOrFail()->id;
        $admin = User::factory()->create(['role' => 'admin']);

        // PUT-only by D2-26 design: PATCH documents the absent contract.
        $this->withHeaders([
            'Authorization' => 'Bearer '.$this->login($admin),
        ])->patchJson('/api/businesses/'.self::UNKNOWN_UUID, $this->validPayload($categoryId))
            ->assertMethodNotAllowed();

        $this->assertDatabaseCount('businesses', 0);
    }
}
