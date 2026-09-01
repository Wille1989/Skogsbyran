<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;

final class AuthService
{
    private const TOKEN_TTL_SECONDS = 10_800;

    public function __construct(
        private readonly JwtService $jwtService
    ){
    }

    public function login(string $email, string $password): array
    {
        $user = User::query()->where('email', $email)->first();

        if (!$user instanceof User || !Hash::check($password, $user->password)) {
            throw new AuthenticationException('Invalid credentials');
        }

        $issuedAt = time();
        $expiresAt = $issuedAt + self::TOKEN_TTL_SECONDS;

        $token = $this->jwtService->encode([
            'iss' => env('JWT_ISSUER'),
            'iat' => $issuedAt,
            'exp' => $expiresAt,
            'userId' => $user->id,
            'email' => $user->email,
            'isAdmin' => $user->admin,
        ]);

        return [
            'id' => $user->id,
            'email' => $user->email,
            'isAdmin' => $user->admin,
            'token' => $token,
        ];
    }
}
