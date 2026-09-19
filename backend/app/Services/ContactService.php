<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class ContactService
{
    public function send(string $name, string $email, string $phone, string $message): void
    {
        $key = config('services.resend.key');
        $from = config('contact.from_email');
        $to = config('contact.to_email');

        if (! is_string($key) || trim($key) === ''
            || ! is_string($from) || ! filter_var($from, FILTER_VALIDATE_EMAIL)
            || ! is_string($to) || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Contact mail configuration is missing or invalid.');
        }

        $payload = [
            'from' => $from,
            'to' => [$to],
            'subject' => 'Ny kontakt från Skogsbyråns webbplats',
            'text' => "Namn: {$name}\nE-post: {$email}\nTelefon: {$phone}\n\nMeddelande:\n{$message}",
        ];

        if ($email !== '') {
            $payload['reply_to'] = $email;
        }

        // Do not retry automatically: an ambiguous timeout may already have sent the email.
        $response = Http::withToken($key)
            ->acceptJson()
            ->connectTimeout(5)
            ->timeout(15)
            ->post('https://api.resend.com/emails', $payload);

        if (! $response->successful() || ! is_string($response->json('id'))) {
            // Never include visitor data, API credentials or provider response bodies in logs.
            throw new RuntimeException('Contact mail provider rejected the request (HTTP '.$response->status().').');
        }
    }
}
