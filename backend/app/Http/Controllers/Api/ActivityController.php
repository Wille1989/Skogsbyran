<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Presenters\ActivityPresenter;
use App\Services\ActivityService;
use Illuminate\Http\JsonResponse;

final class ActivityController extends Controller
{
    public function __construct(
        private readonly ActivityService $activityService,
        private readonly ActivityPresenter $activityPresenter,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json($this->activityPresenter->collection($this->activityService->latest()));
    }
}
