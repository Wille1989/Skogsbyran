<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsStatisticsRequest;
use App\Http\Requests\StoreAnalyticsEventRequest;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class AnalyticsController extends Controller
{
    public function __construct(private readonly AnalyticsService $analyticsService) {}

    public function store(StoreAnalyticsEventRequest $request): Response
    {
        $this->analyticsService->store(
            $request->eventType(),
            $request->filled('property_id') ? $request->integer('property_id') : null,
            $request->filled('image_id') ? $request->integer('image_id') : null,
        );

        return response()->noContent();
    }

    public function statistics(AnalyticsStatisticsRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->analyticsService->statistics($request->string('period')->toString()),
        ]);
    }
}
