<?php

declare(strict_types=1);

namespace App\Modules\Location\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PointOfInterest extends Model
{
    protected $table = 'location_pois';

    protected $fillable = [
        'location_id',
        'name',
        'description',
        'latitude',
        'longitude',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
