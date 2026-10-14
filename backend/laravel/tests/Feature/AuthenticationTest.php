<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_valid_credentials_returns_token(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_type' => User::class,
            'tokenable_id' => $user->id,
            'name' => 'api',
        ]);
    }

    public function test_login_with_wrong_password_is_rejected(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'not-the-password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_with_unknown_email_matches_rejection_shape(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nobody@example.com',
            'password' => 'password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create();

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->postJson('/api/logout');

        $response->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_logout_with_revoked_token_is_rejected(): void
    {
        $user = User::factory()->create();

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->postJson('/api/logout')->assertNoContent();

        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_logout_without_token_is_rejected(): void
    {
        $this->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_logout_leaves_other_tokens_valid(): void
    {
        $user = User::factory()->create();

        $firstToken = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        $secondToken = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$firstToken,
        ])->postJson('/api/logout')->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 1);

        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$secondToken,
        ])->postJson('/api/logout')->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_me_returns_current_user(): void
    {
        $user = User::factory()->create();

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/me');

        $response
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('email', $user->email)
            ->assertJsonMissing(['password', 'remember_token']);
    }

    public function test_me_without_token_is_rejected(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_me_with_revoked_token_is_rejected(): void
    {
        $user = User::factory()->create();

        $token = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('token');

        auth('web')->logout();
        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->postJson('/api/logout')->assertNoContent();

        auth()->forgetGuards();

        $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
        ])->getJson('/api/me')->assertUnauthorized();
    }
}
