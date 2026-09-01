<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\Factory as HttpFactory;
use RuntimeException;

final class SupabaseStorageService
{
    public function __construct(
        private readonly HttpFactory $http
    ) {
    }

    public function isConfigured(): bool
    {
        return $this->supabaseUrl() !== ''
            && $this->bucket() !== ''
            && $this->serviceRoleKey() !== '';
    }

    public function upload(
        string $storageKey,
        string $contents,
        string $contentType
    ): string {
        $this->assertConfigured();

        $response = $this->http
            ->withHeaders([
                'apikey' => $this->serviceRoleKey(),
                'Authorization' =>
                    'Bearer ' . $this->serviceRoleKey(),
                'x-upsert' => 'false',
                'Content-Type' => $contentType,
            ])
            ->withBody(
                $contents,
                $contentType
            )
            ->send(
                'POST',
                $this->objectUrl($storageKey)
            );

        if ($response->failed()) {
            throw new RuntimeException(
                'Supabase upload failed.'
            );
        }

        return $this->publicUrl(
            $storageKey
        );
    }

    public function delete(
        string $storageKey
    ): void {
        $this->assertConfigured();

        $response = $this->http
            ->withHeaders([
                'apikey' => $this->serviceRoleKey(),
                'Authorization' =>
                    'Bearer ' . $this->serviceRoleKey(),
            ])
            ->send(
                'DELETE',
                $this->objectUrl($storageKey)
            );

        if (
            $response->failed()
            && $response->status() !== 404
        ) {
            throw new RuntimeException(
                'Supabase delete failed.'
            );
        }
    }

    private function objectUrl(
        string $storageKey
    ): string {
        return sprintf(
            '%s/storage/v1/object/%s/%s',
            rtrim($this->supabaseUrl(), '/'),
            $this->bucket(),
            $storageKey
        );
    }

    private function publicUrl(
        string $storageKey
    ): string {
        return sprintf(
            '%s/storage/v1/object/public/%s/%s',
            rtrim($this->supabaseUrl(), '/'),
            $this->bucket(),
            $storageKey
        );
    }

    private function assertConfigured(): void
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException(
                'Supabase storage is not configured.'
            );
        }
    }

    private function supabaseUrl(): string
    {
        return (string) config(
            'services.supabase.url',
            ''
        );
    }

    private function bucket(): string
    {
        return (string) config(
            'services.supabase.bucket',
            ''
        );
    }

    private function serviceRoleKey(): string
    {
        return (string) config(
            'services.supabase.service_role_key',
            ''
        );
    }
}