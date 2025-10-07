<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Http\Requests\StoreCourseRequest;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Course::query();

            // Search functionality
            if ($search = $request->query('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('program', 'like', "%{$search}%")
                      ->orWhere('instructor', 'like', "%{$search}%");
                });
            }

            // Filter by program
            if ($program = $request->query('program')) {
                $query->where('program', $program);
            }

            // Filter by status
            if ($status = $request->query('status')) {
                $query->where('status', $status);
            }

            // Filter by academic year
            if ($academicYear = $request->query('academic_year')) {
                $query->where('academic_year', $academicYear);
            }

            $courses = $query->orderBy('name')->get();

            return response()->json([
                'success' => true,
                'courses' => $courses
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch courses'
            ], 500);
        }
    }

    public function store(StoreCourseRequest $request)
    {
        try {
            $course = Course::create($request->validated());
            
            return response()->json([
                'success' => true,
                'message' => 'Course created successfully',
                'course' => $course
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create course'
            ], 500);
        }
    }

    public function show(Course $course)
    {
        try {
            return response()->json([
                'success' => true,
                'course' => $course
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Course not found'
            ], 404);
        }
    }

    public function update(StoreCourseRequest $request, Course $course)
    {
        try {
            $course->update($request->validated());
            
            return response()->json([
                'success' => true,
                'message' => 'Course updated successfully',
                'course' => $course
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update course'
            ], 500);
        }
    }

    public function destroy(Course $course)
    {
        try {
            $course->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Course deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete course'
            ], 500);
        }
    }
}