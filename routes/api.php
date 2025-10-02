<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

// Get all active students
Route::get('/students', function () {
    return response()->json([
        'students' => Student::whereNull('deleted_at')->get()
    ]);
});

// Get archived students
Route::get('/students/archived', function () {
    return response()->json([
        'students' => Student::onlyTrashed()->get()
    ]);
});

// Add Student
Route::post('/students', function (Request $request) {
    $validated = $request->validate([
        'first_name' => 'required|string|max:255',
        'last_name' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'gender' => 'required|string|max:10',
        'birthdate' => 'required|date',
        'phone' => 'nullable|string|max:20',
        'course_id' => 'nullable|string|max:50',
        'department' => 'required|string|max:255',
        'academic_year' => 'required|string|max:10',
        'status' => 'required|string|max:20',
    ]);

    $student = Student::create($validated);
    return response()->json(['message' => 'Student added successfully', 'student' => $student]);
});

// Register
Route::post('/register', function (Request $request) {
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|unique:users',
        'password' => 'required|string|min:6',
    ]);

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
    ]);

    return response()->json(['message' => 'User registered successfully']);
});

// Login
Route::post('/login', function (Request $request) {
    $request->validate([
        'email' => 'required|string|email',
        'password' => 'required|string',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    return response()->json(['message' => 'Login successful', 'user' => $user]);
});

// Update student
Route::put('/students/{id}', function (Request $request, $id) {
    $student = Student::findOrFail($id);
    $student->update($request->all());
    return response()->json(['message' => 'Student updated!']);
});

// Archive (soft delete) student
Route::delete('/students/{id}', function ($id) {
    $student = Student::findOrFail($id);
    $student->delete();
    return response()->json(['message' => 'Student archived!']);
});

// Restore archived student
Route::post('/students/{id}/restore', function ($id) {
    $student = Student::onlyTrashed()->findOrFail($id);
    $student->restore();
    return response()->json(['message' => 'Student restored!']);
});
