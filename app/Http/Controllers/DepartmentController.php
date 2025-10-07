<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Department::query();
            
            // Search functionality
            if ($request->search) {
                $query->search($request->search);
            }
            
            // Status filter
            if ($request->status && $request->status !== 'All Status') {
                $query->where('status', $request->status);
            }
            
            $departments = $query->latest()->get();
            
            return response()->json([
                'success' => true,
                'departments' => $departments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch departments'
            ], 500);
        }
    }
    
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:departments,name',
                'description' => 'nullable|string',
                'budget' => 'nullable|numeric|min:0',
                'status' => 'required|in:Active,Inactive'
            ]);
            
            $department = Department::create($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Department created successfully',
                'department' => $department
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create department'
            ], 500);
        }
    }
    
    public function show(Department $department)
    {
        try {
            $department->load(['students', 'faculty', 'courses']);
            
            return response()->json([
                'success' => true,
                'department' => $department
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }
    }
    
    public function update(Request $request, Department $department)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:departments,name,' . $department->id,
                'description' => 'nullable|string',
                'budget' => 'nullable|numeric|min:0',
                'status' => 'required|in:Active,Inactive'
            ]);
            
            $department->update($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Department updated successfully',
                'department' => $department
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update department'
            ], 500);
        }
    }
    
    public function destroy(Department $department)
    {
        try {
            $department->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Department deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete department'
            ], 500);
        }
    }
}
