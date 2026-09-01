<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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
            'password' => Hash::make('secret-123'),
        ]);

        $response = $this->postJson('/auth/login', [
            'email' => 'admin@skogsbyran.se',
            'password' => 'secret-123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Lyckades!')
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.isAdmin', true);

        $this->assertIsString($response->json('data.token'));
        $this->assertNotEmpty($response->json('data.token'));
    }

    /**
     * Ensure invalid credentials return an authentication error.
     */
    public function test_it_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'admin@skogsbyran.se',
            'password' => Hash::make('secret-123'),
        ]);

        $response = $this->postJson('/auth/login', [
            'email' => 'admin@skogsbyran.se',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJsonPath('error', 'Invalid credentials');
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
}
