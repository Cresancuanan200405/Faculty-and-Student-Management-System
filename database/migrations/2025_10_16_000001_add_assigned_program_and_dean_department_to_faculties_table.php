<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('faculties', function (Blueprint $table) {
            if (!Schema::hasColumn('faculties', 'assigned_program')) {
                $table->string('assigned_program')->nullable()->after('program');
            }
            if (!Schema::hasColumn('faculties', 'dean_department')) {
                $table->string('dean_department')->nullable()->after('assigned_program');
            }
        });
    }

    public function down(): void
    {
        Schema::table('faculties', function (Blueprint $table) {
            if (Schema::hasColumn('faculties', 'dean_department')) {
                $table->dropColumn('dean_department');
            }
            if (Schema::hasColumn('faculties', 'assigned_program')) {
                $table->dropColumn('assigned_program');
            }
        });
    }
};