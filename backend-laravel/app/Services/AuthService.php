<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;

final class AuthService
{
    public function login(string $email, string $password): array
    {
        $user = User::query()->where('email', $email)->first();

        if (!$user instanceof User || !Hash::check($password, $user->password)) {
            throw new AuthenticationException('Invalid credentials');
        }

        $token = $user->createToken('skogsbyran-admin', [
            $user->admin ? 'admin' : 'user',
        ])->plainTextToken;

        return [
            'id' => $user->id,
            'email' => $user->email,
            'isAdmin' => $user->admin,
            'token' => $token,
        ];
    }
}
