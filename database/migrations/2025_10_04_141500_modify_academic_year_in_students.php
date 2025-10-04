<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class ModifyAcademicYearInStudents extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Change academic_year from YEAR to a VARCHAR to store labels like "SY 2020-2021"
        DB::statement("ALTER TABLE `students` MODIFY `academic_year` VARCHAR(50) NOT NULL");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Revert back to YEAR type (will keep only the year portion if data doesn't match)
        DB::statement("ALTER TABLE `students` MODIFY `academic_year` YEAR NOT NULL");
    }
}
