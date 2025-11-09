<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $departments = [
            [
                'name' => 'Arts and Sciences',
                'description' => 'Department of Arts and Sciences offering liberal arts and science programs',
                'budget' => 2500000,
                'status' => 'Active'
            ],
            [
                'name' => 'Accountancy',
                'description' => 'Department of Accountancy providing accounting and financial management education',
                'budget' => 2200000,
                'status' => 'Active'
            ],
            [
                'name' => 'Business Administration',
                'description' => 'Department of Business Administration focusing on management and business studies',
                'budget' => 2800000,
                'status' => 'Active'
            ],
            [
                'name' => 'Criminal Justice Education',
                'description' => 'Department of Criminal Justice Education training future law enforcement professionals',
                'budget' => 2100000,
                'status' => 'Active'
            ],
            [
                'name' => 'Computer Studies',
                'description' => 'Department of Computer Studies offering technology and programming courses',
                'budget' => 3200000,
                'status' => 'Active'
            ],
            [
                'name' => 'Engineering Technology',
                'description' => 'Department of Engineering Technology providing technical and engineering education',
                'budget' => 3500000,
                'status' => 'Active'
            ],
            [
                'name' => 'Law',
                'description' => 'Department of Law offering legal education and jurisprudence programs',
                'budget' => 2900000,
                'status' => 'Active'
            ],
            [
                'name' => 'Nursing',
                'description' => 'Department of Nursing providing healthcare and medical education',
                'budget' => 2700000,
                'status' => 'Active'
            ],
            [
                'name' => 'Teacher Education',
                'description' => 'Department of Teacher Education training future educators and teaching professionals',
                'budget' => 2400000,
                'status' => 'Active'
            ]
        ];

        foreach ($departments as $department) {
            Department::create($department);
        }
    }
}
