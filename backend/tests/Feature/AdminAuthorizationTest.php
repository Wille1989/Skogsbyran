<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AdminAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_routes_require_authentication(): void
    {
        $property = Property::query()->create([
            'title' => 'Protected property',
        ]);

        $this->deleteJson('/property/'.$property->id)
            ->assertUnauthorized();
    }

    public function test_admin_routes_reject_non_admin_users(): void
    {
        $this->actingAs(User::factory()->create(['admin' => false]));

        $property = Property::query()->create([
            'title' => 'Protected property',
        ]);

        $this->deleteJson('/property/'.$property->id)
            ->assertForbidden()
            ->assertJsonPath('message', 'Admin access is required.');
    }

    public function test_admin_routes_allow_admin_users(): void
    {
        $this->actingAs(User::factory()->create(['admin' => true]));

        $property = Property::query()->create([
            'title' => 'Protected property',
        ]);

        $this->deleteJson('/property/'.$property->id)
            ->assertNoContent();
    }

    public function test_admin_routes_do_not_accept_bearer_tokens(): void
    {
        $property = Property::query()->create([
            'title' => 'Protected property',
        ]);

        $this->withHeader('Authorization', 'Bearer obsolete-token')
            ->deleteJson('/property/'.$property->id)
            ->assertUnauthorized();
    }

    public function test_all_property_write_routes_keep_session_and_admin_middleware(): void
    {
        $checked = 0;
        foreach (app('router')->getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'property') || in_array('GET', $route->methods(), true)) {
                continue;
            }

            $middleware = $route->gatherMiddleware();
            $this->assertContains('auth:web', $middleware, $route->uri());
            $this->assertContains('admin', $middleware, $route->uri());
            $checked++;
        }

        $this->assertSame(13, $checked);
    }
}
