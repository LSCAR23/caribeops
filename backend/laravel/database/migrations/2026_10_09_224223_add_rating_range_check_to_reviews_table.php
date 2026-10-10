<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement(
            'ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range_check CHECK (rating BETWEEN 1 AND 5)'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE reviews DROP CONSTRAINT reviews_rating_range_check');
    }
};
