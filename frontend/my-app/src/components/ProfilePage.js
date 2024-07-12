import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import defaultProfilePicture from './assets/default-profile.png'; // Replace with your profile picture placeholder
import './css/ProfilePage.css'; // Import your CSS file for styling
import logo from './assets/logoyazisiz.png'; // Import your logo image

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('https://localhost:5000/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error(error);
        alert('Failed to fetch profile data.');
        navigate('/login');
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <img src={logo} alt="Logo" className="logo" />
      <button className="logout-button" onClick={handleLogout}>Log Out</button>
      <div className="profile-container">
        <div className="left-section">
          <img
            src={user.profile_picture || defaultProfilePicture}
            alt="Profile"
            className="profile-picture"
          />
          <nav className="tabs">
            <Link to="/dashboard" className="tab">Dashboard</Link>
            <Link to="/tasks" className="tab">Tasks</Link>
            <Link to="/projects" className="tab">Projects</Link>
            <Link to="/todos" className="tab">Todos</Link>
            <Link to="/changeProfile" className="tab">Change Profile</Link>
          </nav>
        </div>
        <div className="center-section">
          <h1>Profile</h1>
          <div className="user-details">
            <p><strong>Name:</strong> {user.name} {user.surname}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>School:</strong> {user.school}</p>
            <p><strong>Department:</strong> {user.department}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
