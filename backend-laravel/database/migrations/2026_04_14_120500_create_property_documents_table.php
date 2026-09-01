<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_documents', function (Blueprint $table) {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('property_documents');
    }
};
