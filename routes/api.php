<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\CourseController;

// Get all active students
Route::get('/students', [StudentController::class, 'index']);

// Faculty routes
Route::get('/faculty', [FacultyController::class, 'index']);
Route::post('/faculty', [FacultyController::class, 'store']);
Route::put('/faculty/{id}', [FacultyController::class, 'update']);
Route::delete('/faculty/{id}', [FacultyController::class, 'destroy']);

// Get archived students
Route::get('/students/archived', function () {
    return response()->json([
        'students' => Student::onlyTrashed()->get()
    ]);
});

// Add Student
Route::post('/students', [StudentController::class, 'store']);

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
Route::put('/students/{id}', [StudentController::class, 'update']);

// Archive (soft delete) student
Route::delete('/students/{id}', [StudentController::class, 'destroy']);

// Restore archived student
Route::post('/students/{id}/restore', function ($id) {
    $student = Student::onlyTrashed()->findOrFail($id);
    $student->restore();
    return response()->json(['message' => 'Student restored!']);
});

Route::apiResource('courses', CourseController::class);
