<?php

declare(strict_types=1);

namespace App\Modules\Activity\Models;

use App\Modules\Activity\Enums\EventType;
use App\Modules\Property\Models\Property;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property EventType $event_type
 * @property CarbonImmutable $occurred_at
 */
final class ActivityEvent extends Model
{
    protected $fillable = ['event_type', 'property_id', 'occurred_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['event_type' => EventType::class, 'occurred_at' => 'immutable_datetime'];
    }

    /** @return BelongsTo<Property, $this> */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
