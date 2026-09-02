<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateLocationRequest;
use App\Modules\Property\Models\Property;
use App\Services\LocationService;
use Illuminate\Http\JsonResponse;

final class LocationController extends Controller
{
    public function __construct(
        private readonly LocationService $locationService,
    ) {
    }

    public function update(UpdateLocationRequest $request, Property $property): JsonResponse
    {
        return response()->json(
            $this->locationService->replace($property, $request->validated())
        );
    }
}
