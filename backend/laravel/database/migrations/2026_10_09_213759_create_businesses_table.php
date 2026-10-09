<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name');
            $table->text('description');
            $table->string('type', 120);
            $table->text('address');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->text('website')->nullable();
            $table->string('phone', 32);
            $table->timestamp('created_at');
            $table->timestamp('updated_at');
        });

        DB::statement(
            'ALTER TABLE businesses ADD CONSTRAINT businesses_latitude_range_check CHECK (latitude BETWEEN -90 AND 90)'
        );
        DB::statement(
            'ALTER TABLE businesses ADD CONSTRAINT businesses_longitude_range_check CHECK (longitude BETWEEN -180 AND 180)'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};
