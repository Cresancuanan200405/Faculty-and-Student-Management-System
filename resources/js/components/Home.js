import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className="home-page">
            <div className="home-hero">
                <h1>University Faculty Management System</h1>
                <p>Transformation in Education: Integrity in Action</p>
                <Link className="hero-btn" to="/login">login</Link>
            </div>
        </div>
    );
}