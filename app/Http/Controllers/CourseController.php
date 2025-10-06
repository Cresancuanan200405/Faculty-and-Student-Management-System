<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Http\Requests\StoreCourseRequest;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $q = Course::query();

        if ($s = $request->query('search')) {
            $q->where(function($w) use ($s) {
                $w->where('name','like',"%$s%")
                  ->orWhere('program','like',"%$s%");
            });
        }
        if ($p = $request->query('program')) $q->where('program',$p);
        if ($st = $request->query('status')) $q->where('status',$st);
        if ($y = $request->query('academic_year')) $q->where('academic_year',$y);

        return response()->json(['data'=>$q->orderBy('name')->get()]);
    }

    public function store(StoreCourseRequest $request)
    {
        $course = Course::create($request->validated());
        return response()->json(['data'=>$course], 201);
    }

    public function show(Course $course)
    {
        return response()->json(['data'=>$course]);
    }

    public function update(StoreCourseRequest $request, Course $course)
    {
        $course->update($request->validated());
        return response()->json(['data'=>$course]);
    }

    public function destroy(Course $course)
    {
        $course->delete();
        return response()->json(['message'=>'Deleted']);
    }
}