import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Button, FormControl, Container, Box, Typography, Select, MenuItem, InputLabel, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function ProjectForm({ project, onSave }) {
  const [projectData, setProjectData] = useState({
    project_name: '',
    description: '',
    status: 'todo'
  });
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      try {
        const response = await axios.get('https://localhost:5000/profile', config);
        setIsAdmin(response.data.role === 'admin');
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();

    if (project) {
      setProjectData(project);
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProjectData((prevProjectData) => ({
      ...prevProjectData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    try {
      if (project) {
        await axios.put(`https://localhost:5000/update_project/${project._id}`, projectData, config);
        alert('Project updated successfully!');
      } else {
        await axios.post('https://localhost:5000/add_project', projectData, config);
        alert('Project added successfully!');
      }
      onSave();
      navigate('/projects');
    } catch (error) {
      setError(error.response.data.error);
    }
  };

  if (!isAdmin) {
    return <Typography variant="h6">You do not have permission to access this page.</Typography>;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {project ? 'Update Project' : 'Add Project'}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Project Name"
            name="project_name"
            value={projectData.project_name}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            value={projectData.description}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={projectData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="todo">TODO</MenuItem>
              <MenuItem value="test">TEST</MenuItem>
              <MenuItem value="done">DONE</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            {project ? 'Update' : 'Add'} Project
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default ProjectForm;
