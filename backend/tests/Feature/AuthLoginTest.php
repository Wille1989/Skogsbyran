<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Verify the authentication login endpoint.
 */
class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Match the browser's stateful Sanctum request, independently of local .env values.
        config(['sanctum.stateful' => ['localhost:5173']]);
        $this->withHeader('Origin', 'http://localhost:5173');
    }

    /**
     * Ensure the SPA can initialize Sanctum's CSRF cookie.
     */
    public function test_it_initializes_the_sanctum_csrf_cookie(): void
    {
        $this->get('/sanctum/csrf-cookie')
            ->assertNoContent()
            ->assertCookie('XSRF-TOKEN');
    }

    /**
     * Ensure a valid user can log in with a session cookie and receive the expected payload.
     */
    public function test_it_logs_in_a_user_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@skogsbyran.se',
            'admin' => true,
            'password' => 'secret-123',
        ]);

        $response = $this->postJson('/login', [
            'email' => 'admin@skogsbyran.se',
            'password' => 'secret-123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.isAdmin', true)
            ->assertJsonMissingPath('data.token');

        $this->assertAuthenticatedAs($user);
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

        $response = $this->postJson('/login', [
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
        $response = $this->postJson('/login', []);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_it_returns_the_current_user_for_an_authenticated_session(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@skogsbyran.se',
            'admin' => true,
            'password' => 'secret-123',
        ]);

        $this->actingAs($user)
            ->getJson('/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.isAdmin', true);
    }

    public function test_it_logs_out_the_authenticated_session(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@skogsbyran.se',
            'admin' => true,
            'password' => 'secret-123',
        ]);

        $this->actingAs($user)
            ->postJson('/auth/logout')
            ->assertNoContent();

        $this->assertGuest();
        $this->getJson('/auth/me')->assertUnauthorized();
    }

    public function test_login_is_limited_by_ip_even_when_email_changes(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/login', [
                'email' => 'unknown'.$attempt.'@example.test',
                'password' => 'wrong-password',
            ])->assertUnauthorized();
        }

        $this->postJson('/login', [
            'email' => 'another@example.test',
            'password' => 'wrong-password',
        ])->assertStatus(429)->assertHeader('Retry-After');

        $this->travel(61)->seconds();
        $this->postJson('/login', [
            'email' => 'another@example.test',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_login_limits_are_independent_for_different_ips(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/login', [])->assertUnprocessable();
        }

        $this->postJson('/login', [])->assertStatus(429);
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10'])
            ->postJson('/login', [])->assertUnprocessable();
    }
}
