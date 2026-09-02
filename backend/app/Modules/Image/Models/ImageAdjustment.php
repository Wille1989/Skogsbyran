<?php

declare(strict_types=1);

namespace App\Modules\Image\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ImageAdjustment extends Model
{
    use HasFactory;

    protected $primaryKey = 'image_id';
    public $incrementing = false;

    protected $fillable = [
        'image_id',
        'brightness',
        'contrast',
        'saturation',
        'gamma',
    ];

    protected function casts(): array
    {
        return [
            'brightness' => 'float',
            'contrast' => 'float',
            'saturation' => 'float',
            'gamma' => 'float',
        ];
    }

    public function image(): BelongsTo
    {
        return $this->belongsTo(Image::class);
    }
}
