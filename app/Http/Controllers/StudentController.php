<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use Illuminate\Support\Facades\Storage;

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
            'photo' => 'nullable|image|max:2048',
        ]);

        if (isset($validated['photo'])) {
            $validated['photo_path'] = $validated['photo']->store('photos/students', 'public');
            unset($validated['photo']);
        }

        $student = Student::create($validated);
        return response()->json(['student' => $student->fresh()], 201);
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
            'photo' => 'nullable|image|max:2048',
            'remove_photo' => 'nullable|boolean',
        ]);

        $removePhoto = $request->boolean('remove_photo');

        if ($removePhoto && $student->photo_path) {
            Storage::disk('public')->delete($student->photo_path);
            $validated['photo_path'] = null;
        }

        if (isset($validated['photo'])) {
            if ($student->photo_path) {
                Storage::disk('public')->delete($student->photo_path);
            }
            $validated['photo_path'] = $validated['photo']->store('photos/students', 'public');
            unset($validated['photo']);
        }

        unset($validated['remove_photo']);

        $student->update($validated);
        return response()->json(['student' => $student->fresh()]);
    }

    // Delete a student
    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->delete();
        return response()->json(['message' => 'Student deleted']);
    }
}