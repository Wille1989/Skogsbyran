<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAreaRequest;
use App\Http\Requests\UpdateAreaRequest;
use App\Modules\Property\Models\Property;
use App\Models\Area;
use App\Services\AreaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class AreaController extends Controller
{
    public function __construct(
        private readonly AreaService $areaService
    ) {
    }

    public function index(Property $property): JsonResponse
    {
        return response()->json(
            $this->areaService->listForProperty($property)
        );
    }

    public function store(StoreAreaRequest $request, Property $property): JsonResponse {
        $area = $this->areaService->create($property, $request->validated());

        return response()->json($area, Response::HTTP_CREATED);
    }

    public function show(Property $property, Area $area): JsonResponse {
        return response()->json($this->areaService->show($property, $area));
    }

    public function update(UpdateAreaRequest $request, Property $property, Area $area): JsonResponse {
        $updatedArea = $this->areaService->replace($property, $area, $request->validated());

        return response()->json($updatedArea);
    }

    public function destroy(Property $property, Area $area): Response {
        $this->areaService->delete($property, $area);

        return response()->noContent();
    }
}
