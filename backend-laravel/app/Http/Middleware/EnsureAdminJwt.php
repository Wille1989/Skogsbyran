<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class EnsureAdminJwt
{
    public function __construct(
        private readonly JwtService $jwtService
    ) {
    }

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if ($token === null || $token === '') {
            return $this->unauthorized();
        }

        try {
            $payload = $this->jwtService->decode($token);
        } catch (Throwable) {
            return $this->unauthorized();
        }

        $userId = $payload['userId'] ?? null;

        if (! is_int($userId)) {
            return $this->unauthorized();
        }

        $user = User::query()->find($userId);

        if (! $user instanceof User) {
            return $this->unauthorized();
        }

        if (! $user->admin) {
            return response()->json([
                'message' => 'Admin access is required.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }

    private function unauthorized(): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthenticated.',
        ], Response::HTTP_UNAUTHORIZED);
    }
}
