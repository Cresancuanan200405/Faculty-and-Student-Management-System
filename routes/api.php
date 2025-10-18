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
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

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

// Auth endpoints (controller-based)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
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

// Department routes
Route::apiResource('departments', DepartmentController::class);