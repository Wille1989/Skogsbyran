<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

/**
 * Verify the authentication login endpoint.
 */
class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure a valid user can log in and receive the expected payload.
     */
    public function test_it_logs_in_a_user_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@skogsbyran.se',
            'admin' => true,
            'password' => 'secret-123',
        ]);

        $response = $this->postJson('/auth/login', [
            'email' => 'admin@skogsbyran.se',
            'password' => 'secret-123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.isAdmin', true);

        $token = $response->json('data.token');

        $this->assertIsString($token);
        $this->assertNotEmpty($token);
        $this->assertNotNull(PersonalAccessToken::findToken($token));
    }

    /**
     * Ensure invalid credentials return an authentication error.
     */
    public function test_it_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'admin@skogsbyran.se',
            'password' => 'secret-123',
        ]);

        $response = $this->postJson('/auth/login', [
            'email' => 'admin@skogsbyran.se',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid credentials');
    }

    /**
     * Ensure missing fields are rejected by validation.
     */
    public function test_it_validates_required_login_fields(): void
    {
        $response = $this->postJson('/auth/login', []);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_it_logs_out_the_current_sanctum_token(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@skogsbyran.se',
            'admin' => true,
            'password' => 'secret-123',
        ]);

        $token = $user->createToken('skogsbyran-admin', ['admin'])->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/auth/logout')
            ->assertNoContent();

        $this->assertNull(PersonalAccessToken::findToken($token));
    }

    public function test_it_returns_the_current_user_for_a_real_bearer_token(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@skogsbyran.se',
            'admin' => true,
            'password' => 'secret-123',
        ]);

        $token = $user->createToken('skogsbyran-admin', ['admin'])->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.isAdmin', true);
    }

    public function test_a_logged_out_bearer_token_can_no_longer_authenticate(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@skogsbyran.se',
            'admin' => true,
            'password' => 'secret-123',
        ]);

        $token = $user->createToken('skogsbyran-admin', ['admin'])->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/auth/logout')
            ->assertNoContent();

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/auth/me')
            ->assertUnauthorized();
    }
}
