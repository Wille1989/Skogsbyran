<?php

declare(strict_types=1);

namespace App\Modules\Analytics\Models;

use App\Modules\Analytics\Enums\EventType;
use App\Modules\Image\Models\Image;
use App\Modules\Property\Models\Property;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AnalyticsEvent extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['event_type', 'property_id', 'image_id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['event_type' => EventType::class];
    }

    /** @return BelongsTo<Property, $this> */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /** @return BelongsTo<Image, $this> */
    public function image(): BelongsTo
    {
        return $this->belongsTo(Image::class);
    }
}
