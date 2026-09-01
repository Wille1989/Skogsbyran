<?php

declare(strict_types=1);

namespace App\Modules\Document\Models;

use App\Modules\Property\Models\Property;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Document extends Model
{
    use HasFactory;

    public const TYPE_BID_FORM = 'bid_form';
    public const TYPE_PROSPECT = 'prospect';
    public const TYPE_PROPERTY_MAP = 'property_map';

    public const TYPES = [
        self::TYPE_BID_FORM,
        self::TYPE_PROSPECT,
        self::TYPE_PROPERTY_MAP,
    ];

    protected $fillable = [
        'name',
        'original_filename',
        'mime_type',
        'page_count',
    ];

    protected function casts(): array
    {
        return [
            'page_count' => 'integer',
        ];
    }

    public function properties(): BelongsToMany
    {
        return $this->belongsToMany(Property::class, 'property_documents')
            ->withPivot(['type', 'title', 'sort_order'])
            ->withTimestamps();
    }

    public function variants(): HasMany
    {
        return $this->hasMany(DocumentVariant::class);
    }
}
