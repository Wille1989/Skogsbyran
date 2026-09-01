<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Area extends Model
{
    use HasFactory;

    protected $table = 'property_areas';

    protected $fillable = [
        'property_id',
        'name',
        'area_json',
        'marker_lat',
        'marker_lng',
        'area_square_meters',
    ];

    protected function casts(): array
    {
        return [
            'marker_lat' => 'float',
            'marker_lng' => 'float',
            'area_square_meters' => 'float',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
