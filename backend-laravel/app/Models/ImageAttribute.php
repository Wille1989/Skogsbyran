<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ImageAttribute extends Model
{
    use HasFactory;

    protected $table = 'property_image_attributes';

    protected $fillable = [
        'image_id',
        'caption',
        'alt',
        'brightness',
        'gamma',
        'contrast',
        'saturation',
    ];

    protected function casts(): array
    {
        return [
            'brightness' => 'float',
            'gamma' => 'float',
            'contrast' => 'float',
            'saturation' => 'float',
        ];
    }

    public function image(): BelongsTo
    {
        return $this->belongsTo(Image::class);
    }
}
