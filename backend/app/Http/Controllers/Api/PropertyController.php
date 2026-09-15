<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePropertyRequest;
use App\Modules\Location\Data\AreaData;
use App\Modules\Location\Data\LocationData;
use App\Modules\Property\Models\Property;
use App\Services\PropertyService;
use Illuminate\Http\JsonResponse;

class PropertyController extends Controller
{
    public function __construct(
        private readonly PropertyService $propertyService
    ) {}

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
        $areas = [];
        $inputAreas = $request->input('areas', []);
        if (is_array($inputAreas)) {
            foreach (array_keys($inputAreas) as $index) {
                $areas[] = AreaData::fromRequest($request, 'areas.'.$index.'.');
            }
        }
        $property = $this->propertyService->create(
            $request->validated(),
            $areas,
            $request->input('location') !== null ? LocationData::fromRequest($request, 'location.') : null,
        );

        return response()->json($property, 201);
    }

    public function destroy(Property $property): JsonResponse
    {
        $this->propertyService->delete($property);

        return response()->json([], 204);
    }
}
