<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Services\PropertyService;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\StorePropertyRequest;

class PropertyController extends Controller
{
    public function __construct(
        private readonly PropertyService $propertyService
    ) {
    }

    public function index(): JsonResponse
    {
        $payload = $this->propertyService->collection();

        return response()->json($payload);
    }

    public function show(Property $property): JsonResponse
    {
        return response()->json($this->propertyService->find($property));
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $property = $this->propertyService->create($request->validated());

        return response()->json($property, 201);
    }

    public function destroy(Property $property): JsonResponse
    {
        $this->propertyService->delete($property);

        return response()->json([], 204);
    }
}
