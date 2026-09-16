<?php

declare(strict_types=1);

namespace App\Modules\Property\Models;

use App\Modules\Document\Models\Document;
use App\Modules\Image\Models\Image;
use App\Modules\Location\Models\Area;
use App\Modules\Location\Models\Location;
use App\Modules\Property\Enums\ListingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

/**
 * @property \Carbon\CarbonImmutable|null $publish_at
 * @property ListingStatus $listing_status
 * @property ListingStatus|null $scheduled_listing_status
 * @property \Carbon\CarbonImmutable|null $scheduled_status_at
 */
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
        'publish_at',
        'scheduled_listing_status',
        'scheduled_status_at',
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
            'publish_at' => 'immutable_datetime',
            'scheduled_listing_status' => ListingStatus::class,
            'scheduled_status_at' => 'immutable_datetime',
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

    public function location(): HasOne
    {
        return $this->hasOne(Location::class);
    }

    public function areas(): HasManyThrough
    {
        return $this->hasManyThrough(
            Area::class,
            Location::class,
            'property_id',
            'location_id',
            'id',
            'id'
        )->orderBy('location_areas.sort_order');
    }

    public function images(): HasMany
    {
        return $this->hasMany(Image::class)->orderBy('sort_order');
    }

    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class, 'property_documents')
            ->withPivot(['type', 'title', 'sort_order'])
            ->withTimestamps()
            ->orderBy('property_documents.sort_order');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(Image::class)
            ->where('is_primary', true);
    }
}
