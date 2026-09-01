<?php

declare(strict_types=1);

use App\Modules\Document\Enums\DocumentVariantName;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('property_documents') && !Schema::hasTable('legacy_property_documents')) {
            Schema::rename('property_documents', 'legacy_property_documents');
        }

        Schema::create('documents', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120);
            $table->string('original_filename', 255);
            $table->string('mime_type', 120);
            $table->unsignedInteger('page_count')->nullable();
            $table->timestamps();
        });

        Schema::create('property_documents', function (Blueprint $table): void {
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->string('type', 50)->nullable();
            $table->string('title', 120)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->primary(['property_id', 'document_id']);
            $table->unique(['property_id', 'type'], 'property_documents_property_type_unique');
            $table->index(['property_id', 'sort_order'], 'property_documents_property_sort_order_index');
        });

        Schema::create('document_variants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->string('variant', 32);
            $table->string('storage_key', 1024);
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();

            $table->unique(['document_id', 'variant']);
        });

        $this->migrateLegacyDocuments();

        Schema::dropIfExists('legacy_property_documents');
    }

    public function down(): void
    {
        Schema::create('legacy_property_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('title', 120);
            $table->string('original_name', 255);
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('size_bytes');
            $table->text('url');
            $table->string('storage_key', 255)->nullable();
            $table->timestamps();

            $table->unique(['property_id', 'type']);
        });

        $this->restoreLegacyDocuments();

        Schema::dropIfExists('document_variants');
        Schema::dropIfExists('property_documents');
        Schema::dropIfExists('documents');

        if (Schema::hasTable('legacy_property_documents') && !Schema::hasTable('property_documents')) {
            Schema::rename('legacy_property_documents', 'property_documents');
        }
    }

    private function migrateLegacyDocuments(): void
    {
        if (!Schema::hasTable('legacy_property_documents')) {
            return;
        }

        DB::table('legacy_property_documents')
            ->orderBy('id')
            ->each(function (object $legacy): void {
                $documentId = DB::table('documents')->insertGetId([
                    'name' => $legacy->title,
                    'original_filename' => $legacy->original_name,
                    'mime_type' => $legacy->mime_type,
                    'page_count' => null,
                    'created_at' => $legacy->created_at,
                    'updated_at' => $legacy->updated_at,
                ]);

                DB::table('property_documents')->insert([
                    'property_id' => $legacy->property_id,
                    'document_id' => $documentId,
                    'type' => $legacy->type,
                    'title' => $legacy->title,
                    'sort_order' => $this->legacySortOrder((string) $legacy->type),
                    'created_at' => $legacy->created_at,
                    'updated_at' => $legacy->updated_at,
                ]);

                $storageKey = $legacy->storage_key
                    ?: $this->storageKeyFromUrl($legacy->url);

                if (is_string($storageKey) && $storageKey !== '') {
                    DB::table('document_variants')->insert([
                        'document_id' => $documentId,
                        'variant' => DocumentVariantName::Original->value,
                        'storage_key' => $storageKey,
                        'mime_type' => $legacy->mime_type,
                        'file_size' => $legacy->size_bytes,
                        'created_at' => $legacy->created_at,
                        'updated_at' => $legacy->updated_at,
                    ]);
                }
            });
    }

    private function restoreLegacyDocuments(): void
    {
        DB::table('property_documents')
            ->join('documents', 'property_documents.document_id', '=', 'documents.id')
            ->leftJoin('document_variants', function ($join): void {
                $join->on('documents.id', '=', 'document_variants.document_id')
                    ->where('document_variants.variant', '=', DocumentVariantName::Original->value);
            })
            ->orderBy('property_documents.property_id')
            ->select([
                'property_documents.property_id',
                'property_documents.type',
                'property_documents.title',
                'documents.original_filename',
                'documents.mime_type',
                'document_variants.file_size',
                'document_variants.storage_key',
                'property_documents.created_at',
                'property_documents.updated_at',
            ])
            ->each(function (object $document): void {
                DB::table('legacy_property_documents')->insert([
                    'property_id' => $document->property_id,
                    'type' => $document->type ?? 'document',
                    'title' => $document->title ?? $document->original_filename,
                    'original_name' => $document->original_filename,
                    'mime_type' => $document->mime_type,
                    'size_bytes' => $document->file_size ?? 0,
                    'url' => $this->localUrl($document->storage_key),
                    'storage_key' => $document->storage_key,
                    'created_at' => $document->created_at,
                    'updated_at' => $document->updated_at,
                ]);
            });
    }

    private function legacySortOrder(string $type): int
    {
        return match ($type) {
            'prospect' => 10,
            'bid_form' => 20,
            'property_map' => 30,
            default => 100,
        };
    }

    private function storageKeyFromUrl(mixed $url): ?string
    {
        if (!is_string($url) || $url === '') {
            return null;
        }

        $supabasePrefixPosition = strpos($url, '/storage/v1/object/public/');

        if ($supabasePrefixPosition !== false) {
            $path = substr($url, $supabasePrefixPosition + strlen('/storage/v1/object/public/'));
            $parts = explode('/', $path, 2);

            return $parts[1] ?? null;
        }

        $storagePrefixPosition = strpos($url, '/storage/');

        if ($storagePrefixPosition !== false) {
            return ltrim(substr($url, $storagePrefixPosition + strlen('/storage/')), '/');
        }

        return null;
    }

    private function localUrl(mixed $storageKey): string
    {
        if (!is_string($storageKey) || $storageKey === '') {
            return '';
        }

        return '/storage/'.$storageKey;
    }
};
