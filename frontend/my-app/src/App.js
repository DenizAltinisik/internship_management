import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import  Profile  from './components/Profile';
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<Profile />} />
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;
