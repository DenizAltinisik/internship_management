import React from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HUD = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'logout':
        onLogout();
        navigate('/');
        break;
      default:
        break;
    }
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: 'transparent', boxShadow: 'none', borderBottom: '1px solid black' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, color: 'black' }}>
          Internship Management
        </Typography>
        <Tabs
          value={false}
          onChange={handleTabChange}
          TabIndicatorProps={{ style: { display: 'none' } }} // Hide the default indicator
          sx={{
            '& .MuiTab-root': {
              color: 'black', // Color of the tab text
              borderRight: '1px solid black', // Line between tab buttons
              '&:last-child': {
                borderRight: 'none', // Remove line from the last tab
              },
            },
          }}
        >
          <Tab label="Dashboard" value="dashboard" />
          <Tab label="Profile Page" value="profile" />
          
          <Tab label="Log Out" value="logout" />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

export default HUD;
