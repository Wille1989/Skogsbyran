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
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $encodedHeader = $this->base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR));
        $encodedPayload = $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));

        $signature = hash_hmac('sha256', $encodedHeader.'.'.$encodedPayload, $this->secret(), true);
        $encodedSignature = $this->base64UrlEncode($signature);

        return $encodedHeader.'.'.$encodedPayload.'.'.$encodedSignature;
    }

    /**
     * Verify and decode a signed JWT token.
     *
     * @return array<string, mixed>
     */
    public function decode(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new RuntimeException('Invalid token format.');
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
        $expectedSignature = $this->base64UrlEncode(
            hash_hmac(
                'sha256',
                $encodedHeader.'.'.$encodedPayload,
                $this->secret(),
                true
            )
        );

        if (! hash_equals($expectedSignature, $encodedSignature)) {
            throw new RuntimeException('Invalid token signature.');
        }

        $payloadJson = $this->base64UrlDecode($encodedPayload);
        $payload = json_decode($payloadJson, true);

        if (! is_array($payload)) {
            throw new RuntimeException('Invalid token payload.');
        }

        $expiresAt = $payload['exp'] ?? null;

        if (! is_int($expiresAt) || $expiresAt < time()) {
            throw new RuntimeException('Token has expired.');
        }

        $issuer = $payload['iss'] ?? null;
        $expectedIssuer = env('JWT_ISSUER');

        if (is_string($expectedIssuer) && $expectedIssuer !== '' && $issuer !== $expectedIssuer) {
            throw new RuntimeException('Invalid token issuer.');
        }

        return $payload;
    }

    /**
     * Encode a value using URL-safe base64.
     */
    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $decoded = base64_decode(
            strtr($value, '-_', '+/'),
            true
        );

        if ($decoded === false) {
            throw new RuntimeException('Invalid base64 payload.');
        }

        return $decoded;
    }

    private function secret(): string
    {
        $secret = (string) env('JWT_SECRET');

        if ($secret === '') {
            throw new RuntimeException('JWT secret is not configured.');
        }

        return $secret;
    }
}
