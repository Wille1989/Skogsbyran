<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('images', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

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
        });

        DB::statement('CREATE UNIQUE INDEX images_one_primary_per_property ON images (property_id) WHERE is_primary = true');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS images_one_primary_per_property');

        Schema::dropIfExists('image_variants');
        Schema::dropIfExists('image_adjustments');
        Schema::dropIfExists('image_metadata');
        Schema::dropIfExists('images');
    }
};
