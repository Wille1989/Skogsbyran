<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'caption',
        'price',
        'size',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'size' => 'decimal:2',
        ];
    }

    public function areas(): HasMany
    {
        return $this->hasMany(Area::class)->orderBy('id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(Image::class)->orderBy('position');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class)->orderBy('type');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(PropertyImage::class)
            ->where('is_primary', true);
    }
}