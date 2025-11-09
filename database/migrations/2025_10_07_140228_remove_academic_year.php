<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void {
        Schema::table('courses', function (Blueprint $table) {
            if (Schema::hasColumn('courses', 'academic_year')) {
                $table->dropColumn('academic_year');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('academic_year')->nullable()->after('semester');
        });
    }
};
