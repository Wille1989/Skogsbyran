<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Property;
use App\Presenters\PropertyPresenter;
use Illuminate\Support\Facades\DB;

final class PropertyService
{
    public function __construct(
        private readonly ImageService $imageService,
        private readonly AreaService $areaService,
        private readonly PropertyPresenter $propertyPresenter,
    ) {
    }

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function collection(): array
    {
        $properties = Property::query()
            ->with([
                'images',
                'documents',
                'areas',
            ])
            ->orderByDesc('id')
            ->get();

        return $this->propertyPresenter->collectionToLegacyListWrapped($properties);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function find(Property $property): array
    {
        $property->loadMissing([
            'images',
            'documents',
            'areas',
        ]);

        return $this->propertyPresenter->toLegacyWrapped($property);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, array<string, mixed>>
     */
    public function create(array $validated): array
    {
        $property = DB::transaction(function () use ($validated): Property {
            $property = Property::query()->create(
                $validated['details']
            );

            foreach ($validated['areas'] ?? [] as $area) {
                $this->areaService->create(
                    $property,
                    $area
                );
            }

            if (!empty($validated['images'])) {
                $this->imageService->store(
                    $property,
                    [
                        'images' => $validated['images'],
                    ]
                );
            }

            return $property->load([
                'images',
                'documents',
                'areas',
            ]);
        });

        return $this->propertyPresenter->toLegacyWrapped($property);
    }

    public function delete(Property $property): void
    {
        DB::transaction(function () use ($property): void {
            $property->delete();
        });
    }
}
