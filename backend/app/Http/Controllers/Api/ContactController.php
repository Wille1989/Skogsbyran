<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Services\ContactService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request, ContactService $contact): JsonResponse
    {
        try {
            $contact->send(
                $request->string('name')->toString(),
                $request->string('email')->toString(),
                $request->string('phone')->toString(),
                $request->string('message')->toString(),
            );
        } catch (Throwable $exception) {
            Log::error('Contact email could not be sent.', ['exception_type' => $exception::class]);

            return response()->json(['message' => 'Det gick inte att skicka just nu. Försök igen senare eller kontakta oss via telefon eller e-post.'], 503);
        }

        return response()->json(['message' => 'Tack! Ditt meddelande har skickats. Vi återkommer så snart vi kan.']);
    }
}
