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
        'max_students',
        'status'
    ];

    protected $casts = [
        'credits' => 'integer',
        'max_students' => 'integer',
    ];

    // Add relationships
    public function department()
    {
        return $this->belongsTo(Department::class, 'program', 'name');
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'course_student');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'Active');
    }

    public function scopeByProgram($query, $program)
    {
        return $query->where('program', $program);
    }

    public function scopeByAcademicYear($query, $year)
    {
        return $query->where('academic_year', $year);
    }
}