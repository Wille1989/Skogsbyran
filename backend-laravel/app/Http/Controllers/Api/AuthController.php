<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService
    ){
    }

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $payload = $this->authService->login(
                $request->string('email')->toString(),
                $request->string('password')->toString(),
            );
        } catch (AuthenticationException) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return response()->json([
            'data' => $payload
        ]);
    }
}
