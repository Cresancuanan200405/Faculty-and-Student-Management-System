<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        $departments = [
            ['name' => 'Arts and Sciences', 'description' => 'Department of Arts and Sciences offering liberal arts and science programs', 'budget' => 2500000, 'status' => 'Active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Accountancy', 'description' => 'Department of Accountancy providing accounting and financial management education', 'budget' => 2200000, 'status' => 'Active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Business Administration', 'description' => 'Department of Business Administration focusing on management and business studies', 'budget' => 2800000, 'status' => 'Active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Criminal Justice Education', 'description' => 'Department of Criminal Justice Education training future law enforcement professionals', 'budget' => 2100000, 'status' => 'Active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Computer Studies', 'description' => 'Department of Computer Studies offering technology and programming courses', 'budget' => 3200000, 'status' => 'Active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Engineering Technology', 'description' => 'Department of Engineering Technology providing technical and engineering education', 'budget' => 3500000, 'status' => 'Active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Law', 'description' => 'Department of Law offering legal education and jurisprudence programs', 'budget' => 2900000, 'status' => 'Active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Nursing', 'description' => 'Department of Nursing providing healthcare and medical education', 'budget' => 2700000, 'status' => 'Active', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Teacher Education', 'description' => 'Department of Teacher Education training future educators and teaching professionals', 'budget' => 2400000, 'status' => 'Active', 'created_at' => now(), 'updated_at' => now()]
        ];

        DB::table('departments')->insert($departments);
    }

    public function down()
    {
        DB::table('departments')->whereIn('name', [
            'Arts and Sciences',
            'Accountancy',
            'Business Administration',
            'Criminal Justice Education',
            'Computer Studies',
            'Engineering Technology',
            'Law',
            'Nursing',
            'Teacher Education'
        ])->delete();
    }
};