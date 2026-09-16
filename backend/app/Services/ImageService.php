<?php

declare(strict_types=1);

namespace App\Services;

use App\Modules\Activity\Enums\EventType;
use App\Modules\Image\Models\Image;
use App\Modules\Property\Models\Property;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class ImageService
{
    public function __construct(
        private readonly ImageStorageService $storageService,
        private readonly ActivityService $activityService
    ) {
    }

    public function store(Property $property, array $validated): Collection {
        return DB::transaction(
            function () use ($property, $validated): Collection {
                foreach ($validated['images'] as $imageData) {
                    $file = $imageData['file'];

                    if (!$file instanceof UploadedFile) {
                        throw new RuntimeException(
                            'Invalid image file.'
                        );
                    }

                    $urls = $this->storageService->upload(
                        $file,
                        (int) $property->id
                    );

                    $details = $imageData['details'];
                    $adjustments = $imageData['adjustments'];

                    // An explicit primary must replace a fallback from an earlier upload batch.
                    if ($imageData['isPrimary']) {
                        $property->images()->where('is_primary', true)->update(['is_primary' => false]);
                    }

                    $image = Image::query()->create([
                        'property_id' => $property->id,
                        'sort_order' => (int) $imageData['position'],
                        'is_primary' => (bool) $imageData['isPrimary'],
                    ]);

                    $image->metadata()->create([
                        'caption' => $details['caption'],
                        'alt_text' => $details['altText'],
                    ]);

                    $image->adjustment()->create([
                        'brightness' => (float) $adjustments['brightness'],
                        'saturation' => (float) $adjustments['saturation'],
                        'contrast' => (float) $adjustments['contrast'],
                        'gamma' => (float) $adjustments['gamma'],
                    ]);

                    foreach ($urls['variants'] as $variant => $variantData) {
                        $image->variants()->create([
                            'variant' => $variant,
                            'storage_key' => $variantData['storage_key'],
                            'width' => $variantData['width'],
                            'height' => $variantData['height'],
                            'file_size' => $variantData['file_size'],
                            'mime_type' => $variantData['mime_type'],
                        ]);
                    }
                }

                $this->ensureSinglePrimaryImage($property);

                if ($validated['images'] !== []) {
                    $this->activityService->record(EventType::ImagesUploaded, $property);
                }

                return $property
                    ->images()
                    ->with(['metadata', 'adjustment', 'variants'])
                    ->get();
            }
        );
    }

    public function update(Property $property, array $validated): Collection {
        return DB::transaction(
            function () use ($property, $validated): Collection {
                $patches = $validated['images'];

                $imageIds = array_map(
                    static fn (array $patch): int =>
                        (int) $patch['imageId'],
                    $patches
                );

                $images = Image::query()
                    ->where('property_id', $property->id)
                    ->whereIn('id', $imageIds)
                    ->get()
                    ->keyBy('id');

                foreach ($patches as $patch) {
                    $imageId = (int) $patch['imageId'];
                    $image = $images->get($imageId);

                    if (!$image instanceof Image) {
                        throw (new ModelNotFoundException())->setModel(Image::class, [$imageId]);
                    }

                    $imageUpdates = [];
                    $metadataUpdates = [];
                    $adjustmentUpdates = [];

                    if (array_key_exists('position', $patch)) {
                        $imageUpdates['sort_order'] =
                            (int) $patch['position'];
                    }

                    if (array_key_exists('isPrimary', $patch)) {
                        $imageUpdates['is_primary'] =
                            (bool) $patch['isPrimary'];
                    }

                    if (isset($patch['details'])) {
                        $details = $patch['details'];

                        if (array_key_exists('caption', $details)) {
                            $metadataUpdates['caption'] =
                                $details['caption'];
                        }

                        if (array_key_exists('altText', $details)) {
                            $metadataUpdates['alt_text'] =
                                $details['altText'];
                        }
                    }

                    if (isset($patch['adjustments'])) {
                        $adjustments = $patch['adjustments'];

                        if (
                            array_key_exists(
                                'brightness',
                                $adjustments
                            )
                        ) {
                            $adjustmentUpdates['brightness'] =
                                (float) $adjustments['brightness'];
                        }

                        if (
                            array_key_exists(
                                'saturation',
                                $adjustments
                            )
                        ) {
                            $adjustmentUpdates['saturation'] =
                                (float) $adjustments['saturation'];
                        }

                        if (
                            array_key_exists(
                                'contrast',
                                $adjustments
                            )
                        ) {
                            $adjustmentUpdates['contrast'] =
                                (float) $adjustments['contrast'];
                        }

                        if (
                            array_key_exists('gamma', $adjustments)
                        ) {
                            $adjustmentUpdates['gamma'] =
                                (float) $adjustments['gamma'];
                        }
                    }

                    if ($imageUpdates !== []) {
                        $image->fill($imageUpdates);

                        if ($image->isDirty()) {
                            $image->save();
                        }
                    }

                    if ($metadataUpdates !== []) {
                        $image->metadata()->updateOrCreate(
                            ['image_id' => $image->id],
                            $metadataUpdates
                        );
                    }

                    if ($adjustmentUpdates !== []) {
                        $image->adjustment()->updateOrCreate(
                            ['image_id' => $image->id],
                            $adjustmentUpdates
                        );
                    }
                }

                $this->ensureSinglePrimaryImage($property);

                return $property->images()
                    ->with(['metadata', 'adjustment', 'variants'])
                    ->get();
            }
        );
    }

    public function delete(Property $property, array $validated): void {
        DB::transaction(
            function () use ($property, $validated): void {
                $images = Image::query()
                    ->where('property_id', $property->id)
                    ->whereIn('id', $validated['imageIds'])
                    ->get();

                foreach ($images as $image) {
                    $storageKeys = $image->variants()
                        ->pluck('storage_key')
                        ->filter(static fn (mixed $value): bool =>
                            is_string($value) && $value !== ''
                        )
                        ->values()
                        ->all();

                    if ($storageKeys !== []) {
                        $this->storageService->delete(
                            $storageKeys
                        );
                    }

                    $image->delete();
                }

                $this->ensureSinglePrimaryImage($property);
            }
        );
    }

    private function ensureSinglePrimaryImage(Property $property): void {
        $images = Image::query()
            ->where('property_id', $property->id)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        if ($images->isEmpty()) {
            return;
        }

        $primary = $images->firstWhere(
            'is_primary',
            true
        );

        if (!$primary instanceof Image) {
            $primary = $images->first();

            if (!$primary instanceof Image) {
                return;
            }

            $primary->forceFill([
                'is_primary' => true,
            ])->save();
        }

        Image::query()
            ->where('property_id', $property->id)
            ->whereKeyNot($primary->id)
            ->where('is_primary', true)
            ->update([
                'is_primary' => false,
            ]);
    }

}
