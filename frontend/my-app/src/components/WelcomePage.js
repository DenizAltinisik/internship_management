import React from 'react';
import { Link } from 'react-router-dom';
import logo from './assets/logoyazisiz.png'; // Import your logo image
import './css/WelcomePage.css'; // Import your CSS file for styling

const WelcomePage = () => {
  return (
    <div className="welcome-page">
      
      <h1>Welcome!</h1>
      <Link to="/register" className="button-link">
        <button className="button">Register</button>
      </Link>
      <Link to="/login" className="button-link">
        <button className="button">Login</button>
      </Link>
    </div>
  );
};

export default WelcomePage;
