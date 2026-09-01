<?php

declare(strict_types=1);

namespace App\Services;

use App\Presenters\PropertyPresenter;
use App\Modules\Property\Models\Property;

/**
 * Handle property detail operations and frontend response mapping.
 */
class DetailsService
{
    public function __construct(private readonly PropertyPresenter $propertyPresenter)
    {
    }

    /**
     * Create a property from the details-only form.
     *
     * @param  array<string, mixed>  $validated
     */
    public function store(array $validated): int
    {
        $property = Property::query()->create([
            'title' => $validated['title'],
            'caption' => $validated['caption'] ?? null,
            'price' => $validated['price'] ?? null,
            'size' => $validated['size'] ?? null,
        ]);

        return $property->id;
    }

    /**
     * Patch an existing property's details.
     *
     * @param  array<string, mixed>  $validated
     */
    public function update(Property $property, array $validated): void
    {
        if ($validated !== []) {
            $property->fill($validated);
            $property->save();
        }
    }

    /**
     * Replace an existing property's details.
     *
     * @param  array<string, mixed>  $validated
     */
    public function replace(Property $property, array $validated): array
    {
        $property->fill([
            'title' => $validated['title'],
            'caption' => $validated['caption'],
            'price' => $validated['price'],
            'size' => $validated['size'],
        ]);
        $property->save();

        return $this->propertyPresenter->wrapped($property);
    }

    /**
     * Return one property in the legacy frontend wrapper.
     *
     * @return array<string, array<string, mixed>>
     */
    public function show(Property $property): array
    {
        return $this->propertyPresenter->wrapped($property);
    }

    /**
     * Return all properties in the legacy frontend wrapper.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function index(): array
    {
        $properties = Property::query()
            ->with(['areas', 'images.metadata', 'images.adjustment', 'images.variants', 'documents'])
            ->where('is_visible', true)
            ->orderByDesc('id')
            ->get();

        return $this->propertyPresenter->collectionWrapped($properties);
    }
}
