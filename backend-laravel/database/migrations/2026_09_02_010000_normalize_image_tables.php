<?php

declare(strict_types=1);

use App\Modules\Image\Enums\ImageVariantName;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('property_images') && !Schema::hasTable('images')) {
            Schema::rename('property_images', 'images');
        }

        if (Schema::hasColumn('images', 'position')) {
            Schema::table('images', function (Blueprint $table): void {
                $table->renameColumn('position', 'sort_order');
            });
        }

        Schema::table('images', function (Blueprint $table): void {
            $table->index(['property_id', 'sort_order']);
        });

        Schema::create('image_metadata', function (Blueprint $table): void {
            $table->foreignId('image_id')->primary()->constrained('images')->cascadeOnDelete();
            $table->string('caption', 255)->nullable();
            $table->string('alt_text', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('image_adjustments', function (Blueprint $table): void {
            $table->foreignId('image_id')->primary()->constrained('images')->cascadeOnDelete();
            $table->decimal('brightness', 4, 2)->default(1);
            $table->decimal('contrast', 4, 2)->default(1);
            $table->decimal('saturation', 4, 2)->default(1);
            $table->decimal('gamma', 4, 2)->default(1);
            $table->timestamps();
        });

        Schema::create('image_variants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('image_id')->constrained('images')->cascadeOnDelete();
            $table->string('variant', 32);
            $table->string('storage_key', 1024);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('mime_type', 120)->default('image/webp');
            $table->timestamps();

            $table->unique(['image_id', 'variant']);
            $table->index(['image_id', 'variant']);
        });

        $this->migrateMetadataAndAdjustments();
        $this->migrateVariants();

        if (Schema::hasTable('property_image_attributes')) {
            Schema::drop('property_image_attributes');
        }

        Schema::table('images', function (Blueprint $table): void {
            if (Schema::hasColumn('images', 'original_url')) {
                $table->dropColumn('original_url');
            }

            if (Schema::hasColumn('images', 'thumb_url')) {
                $table->dropColumn('thumb_url');
            }

            if (Schema::hasColumn('images', 'medium_url')) {
                $table->dropColumn('medium_url');
            }

            if (Schema::hasColumn('images', 'large_url')) {
                $table->dropColumn('large_url');
            }

            if (Schema::hasColumn('images', 'storage_key')) {
                $table->dropColumn('storage_key');
            }
        });

        $this->createPrimaryImageConstraint();
    }

    public function down(): void
    {
        $this->dropPrimaryImageConstraint();

        Schema::table('images', function (Blueprint $table): void {
            $table->text('original_url')->nullable();
            $table->text('thumb_url')->nullable();
            $table->text('medium_url')->nullable();
            $table->text('large_url')->nullable();
            $table->text('storage_key')->nullable();
            $table->dropIndex(['property_id', 'sort_order']);
            $table->renameColumn('sort_order', 'position');
        });

        Schema::create('property_image_attributes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('image_id')->constrained('images')->cascadeOnDelete();
            $table->string('caption', 255)->nullable();
            $table->string('alt', 255)->nullable();
            $table->decimal('brightness', 4, 2)->default(1);
            $table->decimal('gamma', 4, 2)->default(1);
            $table->decimal('contrast', 4, 2)->default(1);
            $table->decimal('saturation', 4, 2)->default(1);
            $table->timestamps();

            $table->unique('image_id');
        });

        $this->restoreLegacyImageColumns();

        Schema::dropIfExists('image_variants');
        Schema::dropIfExists('image_adjustments');
        Schema::dropIfExists('image_metadata');

        if (Schema::hasTable('images') && !Schema::hasTable('property_images')) {
            Schema::rename('images', 'property_images');
        }
    }

    private function migrateMetadataAndAdjustments(): void
    {
        if (!Schema::hasTable('property_image_attributes')) {
            return;
        }

        DB::table('property_image_attributes')
            ->orderBy('image_id')
            ->each(function (object $attribute): void {
                DB::table('image_metadata')->insert([
                    'image_id' => $attribute->image_id,
                    'caption' => $attribute->caption,
                    'alt_text' => $attribute->alt,
                    'created_at' => $attribute->created_at,
                    'updated_at' => $attribute->updated_at,
                ]);

                DB::table('image_adjustments')->insert([
                    'image_id' => $attribute->image_id,
                    'brightness' => $attribute->brightness,
                    'contrast' => $attribute->contrast,
                    'saturation' => $attribute->saturation,
                    'gamma' => $attribute->gamma,
                    'created_at' => $attribute->created_at,
                    'updated_at' => $attribute->updated_at,
                ]);
            });
    }

    private function migrateVariants(): void
    {
        DB::table('images')
            ->orderBy('id')
            ->select([
                'id',
                'storage_key',
                'thumb_url',
                'medium_url',
                'large_url',
                'original_url',
                'created_at',
                'updated_at',
            ])
            ->each(function (object $image): void {
                foreach ($this->variantStorageKeys($image) as $variant => $storageKey) {
                    DB::table('image_variants')->insert([
                        'image_id' => $image->id,
                        'variant' => $variant,
                        'storage_key' => $storageKey,
                        'mime_type' => 'image/webp',
                        'created_at' => $image->created_at,
                        'updated_at' => $image->updated_at,
                    ]);
                }
            });
    }

    /**
     * @return array<string, string>
     */
    private function variantStorageKeys(object $image): array
    {
        $decoded = is_string($image->storage_key)
            ? json_decode($image->storage_key, true)
            : null;

        if (is_array($decoded)) {
            return array_filter(
                [
                    ImageVariantName::Thumb->value => $decoded['thumb'] ?? null,
                    ImageVariantName::Medium->value => $decoded['medium'] ?? null,
                    ImageVariantName::Large->value => $decoded['large'] ?? null,
                ],
                static fn (mixed $value): bool => is_string($value) && $value !== ''
            );
        }

        $variants = [
            ImageVariantName::Thumb->value => $this->storageKeyFromUrl($image->thumb_url),
            ImageVariantName::Medium->value => $this->storageKeyFromUrl($image->medium_url),
            ImageVariantName::Large->value => $this->storageKeyFromUrl($image->large_url)
                ?? $this->storageKeyFromUrl($image->original_url),
        ];

        if (is_string($image->storage_key) && $image->storage_key !== '') {
            $variants[ImageVariantName::Large->value] = $image->storage_key;
        }

        return array_filter(
            $variants,
            static fn (?string $value): bool => $value !== null && $value !== ''
        );
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

    private function restoreLegacyImageColumns(): void
    {
        DB::table('images')
            ->orderBy('id')
            ->select(['id'])
            ->each(function (object $image): void {
                $variants = DB::table('image_variants')
                    ->where('image_id', $image->id)
                    ->pluck('storage_key', 'variant')
                    ->all();

                DB::table('images')
                    ->where('id', $image->id)
                    ->update([
                        'storage_key' => json_encode($variants, JSON_THROW_ON_ERROR),
                        'thumb_url' => $this->localUrl($variants[ImageVariantName::Thumb->value] ?? null),
                        'medium_url' => $this->localUrl($variants[ImageVariantName::Medium->value] ?? null),
                        'large_url' => $this->localUrl($variants[ImageVariantName::Large->value] ?? null),
                        'original_url' => $this->localUrl($variants[ImageVariantName::Large->value] ?? null),
                    ]);
            });

        DB::table('image_metadata')
            ->join('image_adjustments', 'image_metadata.image_id', '=', 'image_adjustments.image_id')
            ->orderBy('image_metadata.image_id')
            ->select([
                'image_metadata.image_id',
                'image_metadata.caption',
                'image_metadata.alt_text',
                'image_adjustments.brightness',
                'image_adjustments.gamma',
                'image_adjustments.contrast',
                'image_adjustments.saturation',
                'image_metadata.created_at',
                'image_metadata.updated_at',
            ])
            ->each(function (object $image): void {
                DB::table('property_image_attributes')->insert([
                    'image_id' => $image->image_id,
                    'caption' => $image->caption,
                    'alt' => $image->alt_text,
                    'brightness' => $image->brightness,
                    'gamma' => $image->gamma,
                    'contrast' => $image->contrast,
                    'saturation' => $image->saturation,
                    'created_at' => $image->created_at,
                    'updated_at' => $image->updated_at,
                ]);
            });
    }

    private function localUrl(?string $storageKey): ?string
    {
        if ($storageKey === null || $storageKey === '') {
            return null;
        }

        return '/storage/'.$storageKey;
    }

    private function createPrimaryImageConstraint(): void
    {
        DB::statement('CREATE UNIQUE INDEX images_one_primary_per_property ON images (property_id) WHERE is_primary = true');
    }

    private function dropPrimaryImageConstraint(): void
    {
        DB::statement('DROP INDEX IF EXISTS images_one_primary_per_property');
    }
};
