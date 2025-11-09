<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->unique()->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'position')) {
                $table->enum('position', ['System Administrator', 'Student', 'Faculty'])->default('Student')->after('password');
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('position');
            }
            if (!Schema::hasColumn('users', 'gender')) {
                $table->string('gender')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'birth_date')) {
                $table->date('birth_date')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('users', 'nationality')) {
                $table->string('nationality')->nullable()->after('birth_date');
            }
            if (!Schema::hasColumn('users', 'civil_status')) {
                $table->string('civil_status')->nullable()->after('nationality');
            }
            if (!Schema::hasColumn('users', 'address')) {
                $table->string('address')->nullable()->after('civil_status');
            }
            if (!Schema::hasColumn('users', 'employee_id')) {
                $table->string('employee_id')->unique()->nullable()->after('address');
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('employee_id');
            }
            if (!Schema::hasColumn('users', 'profile_completed')) {
                $table->boolean('profile_completed')->default(false)->after('last_login_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'profile_completed')) {
                $table->dropColumn('profile_completed');
            }
            if (Schema::hasColumn('users', 'last_login_at')) {
                $table->dropColumn('last_login_at');
            }
            if (Schema::hasColumn('users', 'employee_id')) {
                $table->dropUnique(['employee_id']);
                $table->dropColumn('employee_id');
            }
            if (Schema::hasColumn('users', 'address')) {
                $table->dropColumn('address');
            }
            if (Schema::hasColumn('users', 'civil_status')) {
                $table->dropColumn('civil_status');
            }
            if (Schema::hasColumn('users', 'nationality')) {
                $table->dropColumn('nationality');
            }
            if (Schema::hasColumn('users', 'birth_date')) {
                $table->dropColumn('birth_date');
            }
            if (Schema::hasColumn('users', 'gender')) {
                $table->dropColumn('gender');
            }
            if (Schema::hasColumn('users', 'phone')) {
                $table->dropColumn('phone');
            }
            if (Schema::hasColumn('users', 'position')) {
                $table->dropColumn('position');
            }
            if (Schema::hasColumn('users', 'username')) {
                $table->dropUnique(['username']);
                $table->dropColumn('username');
            }
        });
    }
};
