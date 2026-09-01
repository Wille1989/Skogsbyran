<?php

declare(strict_types=1);

namespace App\Modules\Property\Models;

use App\Models\Area;
use App\Models\Document;
use App\Modules\Image\Models\Image;
use App\Modules\Property\Enums\ListingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'caption',
        'slug',
        'price',
        'price_whole_units',
        'size',
        'size_hectares',
        'listing_status',
        'is_visible',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'price_whole_units' => 'integer',
            'size' => 'decimal:2',
            'size_hectares' => 'decimal:4',
            'listing_status' => ListingStatus::class,
            'is_visible' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Property $property): void {
            if ($property->slug === null || $property->slug === '') {
                $property->slug = self::uniqueSlugForTitle($property->title);
            }
        });
    }

    private static function uniqueSlugForTitle(string $title): string
    {
        $base = Str::slug($title);

        if ($base === '') {
            $base = 'property';
        }

        $slug = $base;
        $suffix = 2;

        while (self::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    public function areas(): HasMany
    {
        return $this->hasMany(Area::class)->orderBy('id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(Image::class)->orderBy('sort_order');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class)->orderBy('type');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(Image::class)
            ->where('is_primary', true);
    }
}
