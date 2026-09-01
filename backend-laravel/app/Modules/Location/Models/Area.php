<?php

declare(strict_types=1);

namespace App\Modules\Location\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Area extends Model
{
    protected $table = 'location_areas';

    protected $fillable = [
        'location_id',
        'name',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function points(): HasMany
    {
        return $this->hasMany(AreaPoint::class)->orderBy('sort_order');
    }
}
