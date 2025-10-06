<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;

class StudentController extends Controller
{
    // Get all students
    public function index()
    {
        return response()->json([
            'students' => Student::all()
        ]);
    }

    // Store a new student
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required',
            'last_name' => 'required',
            'email' => 'required|email|unique:students,email',
            'gender' => 'required',
            'academic_year' => 'required',
            'department' => 'required',
            'status' => 'required',
            'program' => 'nullable|string',
            'birthdate' => 'nullable|date',
            'phone' => 'nullable|string',
        ]);

        $student = Student::create($validated);
        return response()->json(['student' => $student], 201);
    }

    // Update a student
    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);
        $validated = $request->validate([
            'first_name' => 'required',
            'last_name' => 'required',
            'email' => 'required|email|unique:students,email,'.$id,
            'gender' => 'required',
            'academic_year' => 'required',
            'department' => 'required',
            'status' => 'required',
            'program' => 'nullable|string',
            'birthdate' => 'nullable|date',
            'phone' => 'nullable|string',
        ]);

        $student->update($validated);
        return response()->json(['student' => $student]);
    }

    // Delete a student
    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->delete();
        return response()->json(['message' => 'Student deleted']);
    }
}