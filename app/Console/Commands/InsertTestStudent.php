<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Student;

class InsertTestStudent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:insert-student';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Insert a test student record';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        Student::create([
            'first_name' => 'Ttest3',
            'last_name' => 'User',
            'email' => 't.test+125@example.com',
            'gender' => 'Male',
            'academic_year' => 'SY 2020-2021',
            'department' => 'Accountancy',
            'status' => 'Active',
            'program' => 'Accountancy',
            'birthdate' => '2004-09-05',
            'phone' => '09517910305',
            'course_id' => '123234'
        ]);

        $this->info('Inserted test student.');
        return 0;
    }
}
