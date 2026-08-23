<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_resumes', function (Blueprint $table) {
            $table->string('original_file_name_cv')->nullable()->after('original_file_path_cv');
            $table->string('original_file_name_linkedin')->nullable()->after('original_file_path_linkedin');
        });

        Schema::table('resume_analytics', function (Blueprint $table) {
            $table->unsignedSmallInteger('original_score')->nullable()->after('error');
            $table->unsignedSmallInteger('score')->nullable()->after('original_score');
            $table->text('suggestion')->nullable()->after('score');
            $table->text('professional_summary')->nullable()->after('suggestion');
        });
    }

    public function down(): void
    {
        Schema::table('resume_analytics', function (Blueprint $table) {
            $table->dropColumn(['original_score', 'score', 'suggestion', 'professional_summary']);
        });

        Schema::table('user_resumes', function (Blueprint $table) {
            $table->dropColumn(['original_file_name_cv', 'original_file_name_linkedin']);
        });
    }
};
