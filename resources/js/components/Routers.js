
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from "./Home";
import AboutUs from "./AboutUs";
import ContactUs from "./ContactUs";
import Login from "./Login";
import ContactDisplay from "./ContactDisplay";
import Navbar from "./Navbar";

export default function Routers() {
    return (
        <Router>
            <Navbar />
            <div className="page-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/aboutus" element={<AboutUs />} />
                    <Route path="/contactus" element={<ContactUs />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/contactdisplay" element={<ContactDisplay />} />
                </Routes>
            </div>
        </Router>
    );
}

if (document.getElementById('root')) {
    ReactDOM.render(<Routers />, document.getElementById('root')); 
}