<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeleteImagesRequest;
use App\Http\Requests\StoreImagesRequest;
use App\Http\Requests\UpdateImagesRequest;
use App\Modules\Property\Models\Property;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class ImageController extends Controller
{
    public function __construct(
        private readonly ImageService $imageService
    ) {
    }

    public function store(StoreImagesRequest $request, Property $property): JsonResponse {
        $images = $this->imageService->store($property, $request->validated());

        return response()->json($images, Response::HTTP_CREATED);
    }

    public function update(UpdateImagesRequest $request, Property $property): JsonResponse {
        $images = $this->imageService->update($property, $request->validated());

        return response()->json($images);
    }

    public function destroy(DeleteImagesRequest $request, Property $property): Response {
        $this->imageService->delete($property, $request->validated());

        return response()->noContent();
    }
}
