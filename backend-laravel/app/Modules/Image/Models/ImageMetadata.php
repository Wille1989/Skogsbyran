<?php

declare(strict_types=1);

namespace App\Modules\Image\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ImageMetadata extends Model
{
    use HasFactory;

    protected $table = 'image_metadata';
    protected $primaryKey = 'image_id';
    public $incrementing = false;

    protected $fillable = [
        'image_id',
        'caption',
        'alt_text',
    ];

    public function image(): BelongsTo
    {
        return $this->belongsTo(Image::class);
    }
}
