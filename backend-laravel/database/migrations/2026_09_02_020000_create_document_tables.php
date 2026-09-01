<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('document_variants');
        Schema::dropIfExists('property_documents');
        Schema::dropIfExists('documents');
    }
};
