import React, { useState } from "react";
import axios from "axios";

export default function ContactUs() {
    const [form, setForm] = useState({ name: "", email: "", contact_number: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [refresh, setRefresh] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            await axios.post("/api/contacts", form);
            setSuccess("Contact registered successfully!");
            setForm({ name: "", email: "", contact_number: "" });
            setRefresh(!refresh);
        } catch (err) {
            setError("Failed to register contact.");
        }
    };

    return (
        <div className="contactus-page">
            <h2>Contact Us</h2>
            <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Contact Number:</label>
                    <input
                        type="text"
                        name="contact_number"
                        value={form.contact_number}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Register Contact</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
                {success && <p style={{ color: "green" }}>{success}</p>}
            </form>
        </div>
    );
}