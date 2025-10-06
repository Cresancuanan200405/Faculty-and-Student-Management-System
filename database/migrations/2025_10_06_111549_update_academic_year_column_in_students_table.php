<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateAcademicYearColumnInStudentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Clean existing data by removing 'SY ' prefix if it exists
        DB::statement("UPDATE students SET academic_year = REPLACE(academic_year, 'SY ', '') WHERE academic_year LIKE 'SY %'");
        
        // Drop course_id column if it exists using raw SQL
        if (Schema::hasColumn('students', 'course_id')) {
            DB::statement("ALTER TABLE students DROP COLUMN course_id");
        }
        
        // Change academic_year column type using raw SQL
        DB::statement("ALTER TABLE students MODIFY academic_year VARCHAR(20) NOT NULL");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Add back course_id column
        DB::statement("ALTER TABLE students ADD COLUMN course_id VARCHAR(255) NULL AFTER phone");
        
        // Change academic_year back to year type
        DB::statement("ALTER TABLE students MODIFY academic_year YEAR NOT NULL");
        
        // Add back 'SY ' prefix to existing data
        DB::statement("UPDATE students SET academic_year = CONCAT('SY ', academic_year) WHERE academic_year NOT LIKE 'SY %'");
    }
}
