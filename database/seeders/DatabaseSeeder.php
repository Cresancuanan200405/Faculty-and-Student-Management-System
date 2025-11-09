<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
<<<<<<< HEAD
        // \App\Models\User::factory(10)->create();
=======
        $this->call([
            DepartmentSeeder::class,
            CourseSeeder::class,
        ]);
>>>>>>> bcad6eccef0fe354b18d40a5b4f31d4ee11b5ff5
    }
}
