<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Faculty;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

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
            'photo' => 'nullable|image|max:2048',
        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        if (isset($validated['photo'])) {
            $validated['photo_path'] = $validated['photo']->store('photos/faculties', 'public');
            unset($validated['photo']);
        }

        $faculty = Faculty::create($validated);

        return response()->json(['faculty' => $faculty->fresh()], 201);
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
            'photo' => 'nullable|image|max:2048',
            'remove_photo' => 'nullable|boolean',
        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();
        $removePhoto = $request->boolean('remove_photo');

        if ($removePhoto && $faculty->photo_path) {
            Storage::disk('public')->delete($faculty->photo_path);
            $validated['photo_path'] = null;
        }

        if (isset($validated['photo'])) {
            if ($faculty->photo_path) {
                Storage::disk('public')->delete($faculty->photo_path);
            }
            $validated['photo_path'] = $validated['photo']->store('photos/faculties', 'public');
            unset($validated['photo']);
        }

        unset($validated['remove_photo']);

        $faculty->update($validated);

        return response()->json(['faculty' => $faculty->fresh()]);
    }

    public function destroy($id)
    {
        $faculty = Faculty::findOrFail($id);
        $faculty->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
