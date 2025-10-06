<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'program',
        'instructor',
        'credits',
        'semester',
        'academic_year',
        'max_students',
        'status'
    ];

    protected $casts = [
        'credits' => 'integer',
        'max_students' => 'integer',
    ];
}