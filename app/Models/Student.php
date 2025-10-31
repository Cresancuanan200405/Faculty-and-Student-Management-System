<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'gender',
        'birthdate',
        'phone',
        'department',
        'academic_year',
        'status',
        'program',
        'photo_path',
    ];

    protected $appends = [
        'photo_url',
    ];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path
            ? asset('storage/' . ltrim($this->photo_path, '/'))
            : null;
    }
}
