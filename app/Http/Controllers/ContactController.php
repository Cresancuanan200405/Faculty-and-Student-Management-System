<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index() {
        return Contact::all();
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'contact_number' => 'required|string|max:255',
        ]);
        return Contact::create($validated);
    }

    public function update(Request $request, $id) {
        $contact = Contact::findOrFail($id);
        $contact->update($request->all());
        return $contact;
    }

    public function destroy($id) {
        Contact::destroy($id);
        return response()->json(null, 204);
    }
}