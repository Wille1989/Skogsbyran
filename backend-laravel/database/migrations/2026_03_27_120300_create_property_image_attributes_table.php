<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_image_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('image_id')->constrained('property_images')->cascadeOnDelete();
            $table->string('caption', 255)->nullable();
            $table->string('alt', 255)->nullable();
            $table->decimal('brightness', 4, 2)->default(1);
            $table->decimal('gamma', 4, 2)->default(1);
            $table->decimal('contrast', 4, 2)->default(1);
            $table->decimal('saturation', 4, 2)->default(1);
            $table->timestamps();

            $table->unique('image_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_image_attributes');
    }
};
