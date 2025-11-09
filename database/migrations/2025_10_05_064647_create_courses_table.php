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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('program');                 // Department
            $table->string('instructor')->nullable();
            $table->unsignedTinyInteger('credits')->nullable();
            $table->string('semester')->nullable();    // 1st / 2nd / Summer
            $table->string('academic_year');           // 2024-2025
            $table->unsignedSmallInteger('max_students')->nullable();
            $table->enum('status',['Active','Inactive'])->default('Active');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['program','academic_year','status']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void {
        Schema::dropIfExists('courses');
    }
};
