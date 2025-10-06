<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;

class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run(): void
    {
        $rows = [
            ['name'=>'Accounting Information System','code'=>'ACC-AIS-101','program'=>'Accountancy','academic_year'=>'2024-2025','status'=>'Active','credits'=>3,'semester'=>'1st'],
            ['name'=>'Internal Auditing','code'=>'ACC-IA-201','program'=>'Accountancy','academic_year'=>'2024-2025','status'=>'Active','credits'=>3,'semester'=>'1st'],
            ['name'=>'Computer Science 1','code'=>'CS-101','program'=>'Computer Studies','academic_year'=>'2024-2025','status'=>'Active','credits'=>4,'semester'=>'1st'],
            ['name'=>'Civil Engineering Statics','code'=>'CE-110','program'=>'Engineering Technology','academic_year'=>'2024-2025','status'=>'Active','credits'=>3,'semester'=>'1st'],
        ];
        foreach ($rows as $r) {
            Course::firstOrCreate(['code'=>$r['code']], $r);
        }
    }
}
