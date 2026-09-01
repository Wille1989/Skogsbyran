<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Property;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

final class PropertyService
{
    public function __construct(
        private readonly ImageService $imageService,
        private readonly AreaService $areaService,
    ) {
    }

    public function collection(): Collection
    {
        return Property::query()
            ->with([
                'images',
                'documents',
                'areas',
            ])
            ->orderByDesc('id')
            ->get();
    }

    public function find(Property $property): Property
    {
        $property->loadMissing([
            'images',
            'documents',
            'areas',
        ]);

        return $property;
    }

    public function create(array $validated): Property
    {
        return DB::transaction(function () use ($validated): Property {
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
    }

    public function delete(Property $property): void
    {
        DB::transaction(function () use ($property): void {
            $property->delete();
        });
    }
}