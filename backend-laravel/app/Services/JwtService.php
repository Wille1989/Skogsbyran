<?php

declare(strict_types=1);

namespace App\Services;

use RuntimeException;

/**
 * Generate compact HS256 JWT tokens without extra package dependencies.
 */
class JwtService
{
    /**
     * Create a signed JWT token.
     *
     * @param  array<string, mixed>  $payload
     */
    public function encode(array $payload): string
    {
        $secret = (string) env('JWT_SECRET');

        if ($secret === '') {
            throw new RuntimeException('JWT secret is not configured.');
        }

        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $encodedHeader = $this->base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR));
        $encodedPayload = $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));

        $signature = hash_hmac('sha256', $encodedHeader.'.'.$encodedPayload, $secret, true);
        $encodedSignature = $this->base64UrlEncode($signature);

        return $encodedHeader.'.'.$encodedPayload.'.'.$encodedSignature;
    }

    /**
     * Encode a value using URL-safe base64.
     */
    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
