<?php

declare(strict_types=1);

namespace App\Modules\Image\Models;

use App\Modules\Image\Enums\ImageVariantName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ImageVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'image_id',
        'variant',
        'storage_key',
        'width',
        'height',
        'file_size',
        'mime_type',
    ];

    protected function casts(): array
    {
        return [
            'variant' => ImageVariantName::class,
            'width' => 'integer',
            'height' => 'integer',
            'file_size' => 'integer',
        ];
    }

    public function image(): BelongsTo
    {
        return $this->belongsTo(Image::class);
    }
}
