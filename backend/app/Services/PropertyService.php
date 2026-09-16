<?php

declare(strict_types=1);

namespace App\Services;

use App\Modules\Activity\Enums\EventType;
use App\Modules\Location\Data\AreaData;
use App\Modules\Location\Data\LocationData;
use App\Modules\Property\Models\Property;
use App\Presenters\PropertyPresenter;
use Illuminate\Support\Facades\DB;

final class PropertyService
{
    public function __construct(
        private readonly ImageService $imageService,
        private readonly AreaService $areaService,
        private readonly LocationService $locationService,
        private readonly PropertyPresenter $propertyPresenter,
        private readonly ActivityService $activityService,
        private readonly PropertyPublicationService $publicationService,
    ) {}

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function collection(bool $includeUnpublished = false): array
    {
        $properties = Property::query()
            ->with([
                'primaryImage.variants',
                'location',
            ])
            ->when(!$includeUnpublished, fn ($query) => $query->where('is_visible', true))
            ->orderByDesc('id')
            ->get();

        return $this->propertyPresenter->collectionWrapped($properties);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function find(Property $property): array
    {
        $property->loadMissing([
            'images.metadata',
            'images.adjustment',
            'images.variants',
            'documents.variants',
            'areas.location',
            'areas.points',
            'location.pois',
        ]);

        return $this->propertyPresenter->wrapped($property);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @param  list<AreaData>  $areas
     * @return array<string, array<string, mixed>>
     */
    public function create(array $validated, array $areas = [], ?LocationData $location = null): array
    {
        $property = DB::transaction(function () use ($validated, $areas, $location): Property {
            $property = Property::query()->create(
                [...$validated['details'], 'is_visible' => false]
            );

            if ($location !== null) {
                $this->locationService->replace($property, $location);
            }

            foreach ($areas as $area) {
                $this->areaService->create(
                    $property,
                    $area
                );
            }

            if (! empty($validated['images'])) {
                $this->imageService->store(
                    $property,
                    [
                        'images' => $validated['images'],
                    ]
                );
            }

            $this->activityService->record(EventType::PropertyCreated, $property);
            $property->is_visible = (bool) ($validated['details']['is_visible'] ?? true);
            $this->publicationService->save($property);

            return $property->load([
                'images.metadata',
                'images.adjustment',
                'images.variants',
                'documents.variants',
                'areas.location',
                'areas.points',
                'location.pois',
            ]);
        });

        return $this->propertyPresenter->wrapped($property);
    }

    public function delete(Property $property): void
    {
        DB::transaction(function () use ($property): void {
            $property->delete();
        });
    }
}
