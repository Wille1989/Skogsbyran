<?php

declare(strict_types=1);

namespace App\Modules\Document\Models;

use App\Modules\Document\Enums\DocumentVariantName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DocumentVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'variant',
        'storage_key',
        'mime_type',
        'file_size',
    ];

    protected function casts(): array
    {
        return [
            'variant' => DocumentVariantName::class,
            'file_size' => 'integer',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
