import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Box, Typography, List, ListItem, ListItemText, IconButton, Collapse, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

function ProjectList({ onEdit }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState({});
  const [userNames, setUserNames] = useState({});
  const [open, setOpen] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');

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
        setUserEmail(response.data.email);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
    fetchProjects();
    fetchUserNames();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.get('https://localhost:5000/get_projects', config);
      setProjects(response.data);
      fetchTasksForProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasksForProjects = async (projects) => {
    const tasks = {};
    for (const project of projects) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        const response = await axios.get(`https://localhost:5000/get_project_tasks/${project._id}`, config);
        tasks[project._id] = response.data;
      } catch (error) {
        console.error(`Error fetching tasks for project ${project._id}:`, error);
      }
    }
    setTasks(tasks);
  };

  const fetchUserNames = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.get('https://localhost:5000/get_user_names', config);
      setUserNames(response.data);
    } catch (error) {
      console.error('Error fetching user names:', error);
    }
  };

  const handleDelete = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      await axios.delete(`https://localhost:5000/delete_project/${projectId}`, config);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      await axios.delete(`https://localhost:5000/delete_task/${taskId}`, config);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditProject = (project) => {
    onEdit(project);
    navigate('/projects/edit');
  };

  const handleEditTask = (task) => {
    navigate(`/tasks/edit/${task._id}`);
  };

  const handleToggle = (projectId) => {
    setOpen((prevOpen) => ({
      ...prevOpen,
      [projectId]: !prevOpen[projectId],
    }));
  };

  const handleBackToProfile = () => {
    navigate('/profile');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Project List
        </Typography>
        <List>
          {projects.map((project) => (
            <div key={project._id}>
              <ListItem button onClick={() => handleToggle(project._id)}>
                <ListItemText 
                  primary={<Typography variant="h5">{project.project_name}</Typography>} 
                  secondary={`Description: ${project.description}, Status: ${project.status}`} 
                />
                {isAdmin && (
                  <>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditProject(project)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(project._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
                {open[project._id] ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={open[project._id]} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 4, pb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Tasks
                  </Typography>
                  <List component="div" disablePadding>
                    {tasks[project._id]?.length > 0 ? (
                      tasks[project._id].filter(task => isAdmin || task.owner === userEmail).map((task) => (
                        <ListItem key={task._id}>
                          <ListItemText 
                            primary={task.header} 
                            secondary={`Description: ${task.details}, Status: ${task.status}, Assignee: ${userNames[task.owner] || task.owner}`} 
                          />
                          {isAdmin && (
                            <>
                              <IconButton edge="end" aria-label="edit" onClick={() => handleEditTask(task)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}>
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No tasks assigned to this project." />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </Collapse>
            </div>
          ))}
        </List>
        {isAdmin && (
          <Button
            variant="contained"
            color="primary" 
            onClick={() => navigate('/projects/new')}
            sx={{ mr: 2 }}  // Margin-right to add some space between buttons
          >
            Add New Project
          </Button>
        )}
        <Button
          variant="contained"
          color="secondary"
          onClick={handleBackToProfile}
        >
          Back to Profile
        </Button>
      </Box>
    </Container>
  );
}

export default ProjectList;
