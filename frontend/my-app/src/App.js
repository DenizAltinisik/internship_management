import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import ProfileEdit from './components/ProfileEdit';
import ProjectForm from './components/ProjectForm';
import ProjectList from './components/ProjectList';
import HUD from './components/HUD';
import TaskEdit from './components/TaskEdit'; // Yeni ekleme

function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleEditProject = (project) => {
    setSelectedProject(project);
  };

  const handleSaveProject = () => {
    setSelectedProject(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <HUD onLogout={handleLogout} />}
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/changeProfile" element={<ProfileEdit />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectList onEdit={handleEditProject} />} />
          <Route path="/projects/new" element={<ProjectForm onSave={handleSaveProject} />} />
          <Route path="/projects/edit" element={<ProjectForm project={selectedProject} onSave={handleSaveProject} />} />
          <Route path="/tasks/edit/:taskId" element={<TaskEdit />} /> {/* Yeni ekleme */}
          <Route path="/settings" element={<div>Settings Page</div>} /> {/* Placeholder for Settings Page */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
