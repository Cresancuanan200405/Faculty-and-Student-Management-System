<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Extend enum to include 'Archived' without requiring doctrine/dbal
        DB::statement("ALTER TABLE `courses` MODIFY COLUMN `status` ENUM('Active','Inactive','Archived') NOT NULL DEFAULT 'Active'");
        DB::statement("ALTER TABLE `departments` MODIFY COLUMN `status` ENUM('Active','Inactive','Archived') NOT NULL DEFAULT 'Active'");
    }

    public function down(): void
    {
        // Revert to original enum values (may fail if rows still set to Archived)
        // Safely convert any 'Archived' rows to 'Inactive' before narrowing enum
        DB::statement("UPDATE `courses` SET `status`='Inactive' WHERE `status`='Archived'");
        DB::statement("UPDATE `departments` SET `status`='Inactive' WHERE `status`='Archived'");
        DB::statement("ALTER TABLE `courses` MODIFY COLUMN `status` ENUM('Active','Inactive') NOT NULL DEFAULT 'Active'");
        DB::statement("ALTER TABLE `departments` MODIFY COLUMN `status` ENUM('Active','Inactive') NOT NULL DEFAULT 'Active'");
    }
};
