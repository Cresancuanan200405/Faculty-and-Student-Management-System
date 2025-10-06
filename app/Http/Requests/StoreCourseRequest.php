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
            'semester'      => 'nullable|string|max:255',
            'academic_year' => 'required|string|max:255',
            'max_students'  => 'nullable|integer|min:1',
            'status'        => 'required|in:Active,Inactive',
        ];
    }
}