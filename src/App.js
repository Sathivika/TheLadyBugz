import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./Components/Home";
import Dashboard from "./Components/Dashboard";
import Features from "./Components/Features";
import About from "./Components/About";
import Respond from "./Components/About";
import Alert from "./Components/Alert";


function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/Features" element={<Features />} />
          <Route path="/About" element={<About />} />
          <Route path="/Respond" element={<Respond /> } />
          <Route path="/Alert" element ={<Alert />} />


        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;