<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Raw DDL is deliberate: the Schema builder cannot express IF NOT EXISTS
     * for indexes, and this migration must tolerate the live D5-19 index
     * (same name) as well as create it on fresh databases (D5-21).
     */
    public function up(): void
    {
        DB::statement('CREATE INDEX IF NOT EXISTS reviews_business_id_index ON reviews (business_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS reviews_business_id_index');
    }
};
