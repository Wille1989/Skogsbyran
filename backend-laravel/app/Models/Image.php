<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Image extends Model
{
    use HasFactory;

    protected $table = 'property_images';

    protected $fillable = [
        'property_id',
        'position',
        'is_primary',

        'original_url',
        'thumb_url',
        'medium_url',
        'large_url',
        'storage_key',

        'caption',
        'alt_text',

        'brightness',
        'contrast',
        'saturation',
        'gamma',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_primary' => 'boolean',

            'brightness' => 'float',
            'contrast' => 'float',
            'saturation' => 'float',
            'gamma' => 'float',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
