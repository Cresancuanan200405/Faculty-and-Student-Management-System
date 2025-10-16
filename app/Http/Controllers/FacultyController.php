<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Faculty;
use Illuminate\Support\Facades\Validator;

class FacultyController extends Controller
{
    public function index()
    {
        $faculty = Faculty::orderBy('last_name')->get();
        return response()->json(['faculty' => $faculty]);
    }

    public function store(Request $request)
    {
        $rules = [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:faculties,email',
            'gender' => 'nullable|string',
            'birthdate' => 'nullable|date',
            'phone' => 'nullable|string',
            'department' => 'nullable|string',
            'program' => 'nullable|string',
            'assigned_program' => 'nullable|string',
            'dean_department' => 'nullable|string',
            'academic_year' => 'nullable|string',
            'status' => 'nullable|string',
        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $faculty = Faculty::create($request->only(array_keys($rules)));

        return response()->json(['faculty' => $faculty], 201);
    }

    public function update(Request $request, $id)
    {
        $faculty = Faculty::findOrFail($id);

        $rules = [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:faculties,email,' . $faculty->id,
            'gender' => 'nullable|string',
            'birthdate' => 'nullable|date',
            'phone' => 'nullable|string',
            'department' => 'nullable|string',
            'program' => 'nullable|string',
            'assigned_program' => 'nullable|string',
            'dean_department' => 'nullable|string',
            'academic_year' => 'nullable|string',
            'status' => 'nullable|string',
        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $faculty->update($request->only(array_keys($rules)));

        return response()->json(['message' => 'Updated']);
    }

    public function destroy($id)
    {
        $faculty = Faculty::findOrFail($id);
        $faculty->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
