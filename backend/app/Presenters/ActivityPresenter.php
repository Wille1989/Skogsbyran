<?php

declare(strict_types=1);

namespace App\Presenters;

use App\Modules\Activity\Models\ActivityEvent;
use App\Modules\Location\Models\Location;
use Illuminate\Database\Eloquent\Collection;

final class ActivityPresenter
{
    /**
     * @param  Collection<int, ActivityEvent>  $events
     * @return array{data: list<array{id: string, eventType: string, property: array{propertyId: string, title: string, city: string|null}|null, occurredAt: string}>}
     */
    public function collection(Collection $events): array
    {
        return ['data' => $events->map(function (ActivityEvent $event): array {
            $property = $event->property;
            $location = $property?->location;

            return [
                'id' => (string) $event->id,
                'eventType' => $event->event_type->value,
                'property' => $property === null ? null : [
                    'propertyId' => (string) $property->id,
                    'title' => $property->title,
                    'city' => $location instanceof Location ? $location->city : null,
                ],
                'occurredAt' => $event->occurred_at->toIso8601String(),
            ];
        })->values()->all()];
    }
}
