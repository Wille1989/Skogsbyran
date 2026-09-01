<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Models\Document;
use App\Modules\Property\Models\Property;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class DocumentController extends Controller
{
    public function __construct(
        private readonly DocumentService $documentService
    ) {
    }

    public function store(StoreDocumentRequest $request, Property $property): JsonResponse {
        $document = $this->documentService->store($property, $request->validated());

        return response()->json($document, Response::HTTP_CREATED);
    }

    public function update(UpdateDocumentRequest $request, Property $property, Document $document): JsonResponse {
        $document = $this->documentService->update($property, $document, $request->validated());

        return response()->json($document);
    }

    public function destroy(Property $property, Document $document): Response {
        $this->documentService->delete($property, $document);

        return response()->noContent();
    }
}
