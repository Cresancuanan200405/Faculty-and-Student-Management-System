<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddArchivedToConatacts extends Migration
{
    
public function up()
{
    Schema::table('contacts', function (Blueprint $table) {
        $table->boolean('archived')->default(false);
    });
}

    /**
     * Reverse the migrations.pgp
     *
     * @return void
     */
    public function down()
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn('archived');
        });
    }
}