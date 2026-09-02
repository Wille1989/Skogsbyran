<?php

declare(strict_types=1);

namespace App\Modules\Location\Models;

use App\Modules\Property\Models\Property;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Location extends Model
{
    protected $fillable = [
        'property_id',
        'address',
        'postal_code',
        'city',
        'municipality',
        'country_code',
        'latitude',
        'longitude',
        'google_place_id',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function areas(): HasMany
    {
        return $this->hasMany(Area::class)->orderBy('sort_order');
    }

    public function pois(): HasMany
    {
        return $this->hasMany(PointOfInterest::class);
    }
}
