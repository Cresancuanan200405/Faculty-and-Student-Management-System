<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'program'       => 'required|string|max:255',
            'instructor'    => 'nullable|string|max:255',
            'credits'       => 'nullable|integer|min:0|max:30',
            'max_students'  => 'nullable|integer|min:1',
            'status'        => 'required|in:Active,Inactive',
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Course name is required.',
            'program.required' => 'Program is required.',
            'credits.integer' => 'Credits must be a number.',
            'credits.min' => 'Credits must be at least 0.',
            'credits.max' => 'Credits cannot exceed 30.',
            'max_students.min' => 'Maximum students must be at least 1.',
            'status.in' => 'Status must be Active or Inactive.',
        ];
    }
}