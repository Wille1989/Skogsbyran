<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDetailsRequest;
use App\Modules\Property\Models\Property;
use App\Services\DetailsService;
use Illuminate\Http\Response;

class DetailsController extends Controller
{
    public function __construct(
        private readonly DetailsService $detailsService
    ){ 
    }

    public function update(UpdateDetailsRequest $request, Property $property): Response
    {
        $this->detailsService->update($property, $request->validated());

        return response()->noContent();
    }
}
