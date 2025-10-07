<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'budget',
        'status'
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function students()
    {
        return $this->hasMany(Student::class, 'department', 'name');
    }

    public function faculty()
    {
        return $this->hasMany(Faculty::class, 'department', 'name');
    }

    public function courses()
    {
        return $this->hasMany(Course::class, 'program', 'name');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'Active');
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', "%{$search}%");
    }
}
