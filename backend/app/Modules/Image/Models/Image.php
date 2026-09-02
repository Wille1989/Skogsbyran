<?php

declare(strict_types=1);

namespace App\Modules\Image\Models;

use App\Modules\Property\Models\Property;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

final class Image extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'sort_order',
        'is_primary',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_primary' => 'boolean',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function metadata(): HasOne
    {
        return $this->hasOne(ImageMetadata::class);
    }

    public function adjustment(): HasOne
    {
        return $this->hasOne(ImageAdjustment::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ImageVariant::class);
    }
}
