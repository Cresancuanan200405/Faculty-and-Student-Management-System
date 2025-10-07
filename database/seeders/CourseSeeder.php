<?php

namespace Database\Seeders;

use App\Models\Course;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run(): void
    {
        $courses = [
            // ACCOUNTANCY
            [
                'name' => 'Accountancy',
                'description' => 'Comprehensive accounting principles and practices',
                'program' => 'Accountancy',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Accounting Information System',
                'description' => 'Computer-based accounting systems and information management',
                'program' => 'Accountancy',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Internal Auditing',
                'description' => 'Principles and practices of internal audit functions',
                'program' => 'Accountancy',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Management Accounting',
                'description' => 'Cost accounting and managerial decision-making',
                'program' => 'Accountancy',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],

            // BUSINESS ADMINISTRATION
            [
                'name' => 'Business Administration Program',
                'description' => 'Fundamentals of business management and administration',
                'program' => 'Business Administration',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Operation Management',
                'description' => 'Management of business operations and processes',
                'program' => 'Business Administration',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Financials Management',
                'description' => 'Corporate finance and financial decision making',
                'program' => 'Business Administration',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Marketing Management',
                'description' => 'Strategic marketing and brand management',
                'program' => 'Business Administration',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Human Resource Management',
                'description' => 'HR strategies and personnel management',
                'program' => 'Business Administration',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],

            // COMPUTER STUDIES
            [
                'name' => 'Computer Science',
                'description' => 'Fundamentals of computer science and programming',
                'program' => 'Computer Studies',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Information Technology',
                'description' => 'IT systems, networks, and technology management',
                'program' => 'Computer Studies',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Information Technology with Special Training in Computer Animation',
                'description' => 'IT with specialized focus on computer animation and graphics',
                'program' => 'Computer Studies',
                'credits' => 4,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Diploma in Information Technology',
                'description' => 'Diploma program covering essential IT skills',
                'program' => 'Computer Studies',
                'credits' => 2,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Library and Information Science',
                'description' => 'Information management and library systems',
                'program' => 'Computer Studies',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Entertainment and Multimedia Computing',
                'description' => 'Multimedia technology and entertainment computing',
                'program' => 'Computer Studies',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],

            // ENGINEERING TECHNOLOGY
            [
                'name' => 'Civil Engineering',
                'description' => 'Design and construction of infrastructure and buildings',
                'program' => 'Engineering Technology',
                'credits' => 4,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Industrial Engineering',
                'description' => 'Optimization of complex processes and systems',
                'program' => 'Engineering Technology',
                'credits' => 4,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],

            // TEACHER EDUCATION
            [
                'name' => 'Elementary Education',
                'description' => 'Teaching methods and curriculum for elementary students',
                'program' => 'Teacher Education',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Early Childhood Education',
                'description' => 'Child development and early learning strategies',
                'program' => 'Teacher Education',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Physical Education',
                'description' => 'Sports science and physical fitness education',
                'program' => 'Teacher Education',
                'credits' => 2,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Special Needs Education',
                'description' => 'Teaching students with special educational needs',
                'program' => 'Teacher Education',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ],
            [
                'name' => 'Secondary Education',
                'description' => 'Teaching methods for high school level education',
                'program' => 'Teacher Education',
                'credits' => 3,
                'academic_year' => 'SY 2024-2025',
                'status' => 'Active'
            ]
        ];

        foreach ($courses as $course) {
            Course::create($course);
        }
    }
}
