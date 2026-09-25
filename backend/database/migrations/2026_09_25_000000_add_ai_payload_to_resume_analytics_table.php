<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resume_analytics', function (Blueprint $table) {
            $table->json('ai_payload')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('resume_analytics', function (Blueprint $table) {
            $table->dropColumn('ai_payload');
        });
    }
};
