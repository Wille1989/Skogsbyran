<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PropertyDocument extends Model
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
        'property_id',
        'type',
        'title',
        'original_name',
        'mime_type',
        'size_bytes',
        'url',
        'storage_key',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
