<?php

declare(strict_types=1);

namespace App\Modules\Location\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AreaPoint extends Model
{
    protected $fillable = [
        'area_id',
        'latitude',
        'longitude',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'sort_order' => 'integer',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }
}
