<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6'],
            'position' => ['required', Rule::in(['System Administrator', 'Student', 'Faculty'])],
        ]);

        $user = new User();
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->username = $data['username'];
        $user->password = Hash::make($data['password']);
        $user->position = $data['position'];
        if ($user->position === 'System Administrator') {
            $user->employee_id = $this->generateEmployeeId();
        }
        $user->save();

        return response()->json(['message' => 'Registered successfully'], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $loginField = filter_var($credentials['email'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        if (!Auth::attempt([$loginField => $credentials['email'], 'password' => $credentials['password']])) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        /** @var User $user */
        $user = Auth::user();
        $user->last_login_at = now();
        $user->save();

        $token = method_exists($user, 'createToken') ? $user->createToken('auth_token')->plainTextToken : null;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        
        // Add full URL for profile image
        if ($user->profile_image) {
            $user->profile_image_url = asset('storage/' . $user->profile_image);
        }
        
        return response()->json($user);
    }

    public function updateProfile(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'max:50'],
            'birth_date' => ['nullable', 'date'],
            'nationality' => ['nullable', 'string', 'max:255'],
            'civil_status' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'profile_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'], // 2MB max
        ]);

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            // Delete old profile image if exists
            if ($user->profile_image && file_exists(public_path('storage/' . $user->profile_image))) {
                unlink(public_path('storage/' . $user->profile_image));
            }
            
            // Store new profile image
            $imagePath = $request->file('profile_image')->store('profile-images', 'public');
            $data['profile_image'] = $imagePath;
        }

        unset($data['employee_id']);
        unset($data['position']);

        $user->fill($data);

        if ($user->position === 'System Administrator') {
            $required = [
                $user->name,
                $user->gender,
                $user->birth_date,
                $user->nationality,
                $user->civil_status,
                $user->phone,
                $user->address,
            ];
            $user->profile_completed = !in_array(null, $required, true) && $user->employee_id !== null;
        }

        $user->save();

        // Add full URL for profile image in response
        if ($user->profile_image) {
            $user->profile_image_url = asset('storage/' . $user->profile_image);
        }

        return response()->json(['message' => 'Profile updated', 'user' => $user]);
    }

    public function logout(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        if ($user && method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }
        return response()->json(['message' => 'Logged out']);
    }

    private function generateEmployeeId(): string
    {
        $year = now()->year;
        do {
            $seq = str_pad((string) random_int(1, 999), 3, '0', STR_PAD_LEFT);
            $id = "EMP-{$year}-{$seq}";
        } while (User::where('employee_id', $id)->exists());
        return $id;
    }
}
