<?php

declare(strict_types=1);

namespace App\Services;

use App\Presenters\PropertyPresenter;
use App\Models\Property;

/**
 * Handle property detail operations and frontend response mapping.
 */
class PropertyDetailsService
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

        return $this->propertyPresenter->toLegacyWrapped($property);
    }

    /**
     * Return one property in the legacy frontend wrapper.
     *
     * @return array<string, array<string, mixed>>
     */
    public function show(Property $property): array
    {
        return $this->propertyPresenter->toLegacyWrapped($property);
    }

    /**
     * Return all properties in the legacy frontend wrapper.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function index(): array
    {
        $properties = Property::query()
            ->with(['area', 'images.metadata'])
            ->orderByDesc('id')
            ->get();

        return $this->propertyPresenter->collectionToLegacyWrapped($properties);
    }
}
