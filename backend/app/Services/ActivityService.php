<?php

declare(strict_types=1);

namespace App\Services;

use App\Modules\Activity\Enums\EventType;
use App\Modules\Activity\Models\ActivityEvent;
use App\Modules\Property\Models\Property;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

final class ActivityService
{
    public function record(EventType $type, Property $property): void
    {
        if (in_array($type, [EventType::PropertyUpdated, EventType::ImagesUploaded], true)) {
            $this->recordLatest($type, $property);

            return;
        }

        ActivityEvent::query()->create([
            'event_type' => $type,
            'property_id' => $property->id,
            'occurred_at' => now(),
        ]);
    }

    /** Update one activity per property and type, including concurrent requests. */
    private function recordLatest(EventType $type, Property $property): void
    {
        DB::transaction(function () use ($type, $property): void {
            Property::query()->lockForUpdate()->findOrFail($property->id);
            ActivityEvent::query()->updateOrCreate(
                ['event_type' => $type->value, 'property_id' => $property->id],
                ['occurred_at' => now()],
            );
        });
    }

    /** @return Collection<int, ActivityEvent> */
    public function latest(): Collection
    {
        return ActivityEvent::query()
            ->with(['property:id,title', 'property.location:id,property_id,city'])
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get();
    }
}
