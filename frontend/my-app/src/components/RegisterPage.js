import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Box, Typography, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logoyazisiz.png'; // Import your logo image
import './css/RegisterPage.css'; // Import your custom CSS file for additional styles

const logoStyle = {
  width: '100px', // Adjust width as needed
  height: 'auto', // Maintain aspect ratio
  position: 'absolute',
  top: '20px', // Adjust top position
  left: '20px', // Adjust left position
};

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const response = await axios.post('https://localhost:5000/register', {
        email,
        password,
        name,
        surname,
        phone,
        school,
        department,
        role
      });
      console.log(response.data);
      setSuccessMessage('Successful registration');
      setTimeout(() => {
        navigate('/');
      }, 3000); // Redirect to the welcome page after 3 seconds
    } catch (error) {
      console.error('Registration failed:', error);
      setErrorMessage('Registration failed. Please try again.');
    }
  };

  return (
    <div className="register-page">
      <Container maxWidth="sm">
        <img src={logo} alt="Logo" style={logoStyle} />
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Register
          </Typography>
          {successMessage && <Alert severity="success">{successMessage}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <form>
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Surname"
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="School"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="intern">Intern</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="button"
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleRegister}
              sx={{ mt: 3, mb: 2 }}
            >
              Register
            </Button>
          </form>
        </Box>
      </Container>
    </div>
  );
};

export default RegisterPage;
