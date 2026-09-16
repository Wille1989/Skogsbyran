<?php

declare(strict_types=1);

namespace App\Services;

use App\Modules\Analytics\Enums\EventType;
use App\Modules\Analytics\Models\AnalyticsEvent;
use Carbon\CarbonImmutable;

final class AnalyticsService
{
    public function store(EventType $type, ?int $propertyId, ?int $imageId): void
    {
        AnalyticsEvent::query()->create([
            'event_type' => $type,
            'property_id' => $propertyId,
            'image_id' => $imageId,
        ]);
    }

    /**
     * Compare the selected rolling interval with the preceding equal interval.
     *
     * @return array<string, array{count: int, change: float|null}>
     */
    public function statistics(string $period): array
    {
        $days = match ($period) {
            'week' => 7,
            'month' => 30,
            'quarter' => 90,
            'year' => 365,
            default => throw new \InvalidArgumentException('Unsupported statistics period.'),
        };
        $end = CarbonImmutable::now();
        $start = $end->subDays($days);
        $previousStart = $start->subDays($days);
        $statistics = [];

        foreach (EventType::cases() as $type) {
            $query = AnalyticsEvent::query()->where('event_type', $type->value);
            $count = (clone $query)->where('created_at', '>=', $start)->where('created_at', '<', $end)->count();
            $previous = (clone $query)->where('created_at', '>=', $previousStart)->where('created_at', '<', $start)->count();
            $statistics[$type->value] = [
                'count' => $count,
                'change' => $previous > 0 ? round(($count - $previous) / $previous * 100, 1) : null,
            ];
        }

        return $statistics;
    }
}
