<?php

declare(strict_types=1);

namespace App\Services;

use App\Modules\Activity\Enums\EventType;
use App\Modules\Property\Models\Property;
use Illuminate\Support\Facades\DB;

final class PropertyPublicationService
{
    public function __construct(private readonly ActivityService $activityService) {}

    /** Persist prepared changes inside the caller's locked transaction. */
    public function save(Property $property): bool
    {
        $wasVisible = (bool) $property->getRawOriginal('is_visible');
        if ($property->is_visible) {
            $property->publish_at = null;
        }
        if (! $property->isDirty()) {
            return false;
        }
        $property->save();
        if ($wasVisible !== $property->is_visible) {
            $this->activityService->record(
                $property->is_visible ? EventType::PropertyPublished : EventType::PropertyUnpublished,
                $property,
            );
        }

        return true;
    }

    /** Apply due schedules once, rechecking each property under a row lock. */
    public function applyDue(): int
    {
        $applied = 0;
        Property::query()
            ->where('publish_at', '<=', now())
            ->orWhere('scheduled_status_at', '<=', now())
            ->select('id')
            ->chunkById(100, function ($properties) use (&$applied): void {
                foreach ($properties as $candidate) {
                    $applied += DB::transaction(function () use ($candidate): int {
                        $property = Property::query()->lockForUpdate()->find($candidate->id);
                        if ($property === null) {
                            return 0;
                        }
                        $now = now();
                        $statusChanged = false;
                        if ($property->publish_at !== null && $property->publish_at->lessThanOrEqualTo($now)) {
                            $property->is_visible = true;
                            $property->publish_at = null;
                        }
                        if ($property->scheduled_status_at !== null && $property->scheduled_status_at->lessThanOrEqualTo($now)) {
                            if ($property->scheduled_listing_status !== null) {
                                $property->listing_status = $property->scheduled_listing_status;
                                $statusChanged = $property->isDirty('listing_status');
                            }
                            $property->scheduled_listing_status = null;
                            $property->scheduled_status_at = null;
                        }
                        $changed = $this->save($property);
                        if ($statusChanged) {
                            $this->activityService->record(EventType::PropertyUpdated, $property);
                        }

                        return $changed ? 1 : 0;
                    });
                }
            });

        return $applied;
    }
}
