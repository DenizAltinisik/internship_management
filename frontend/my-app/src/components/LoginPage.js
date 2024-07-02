import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('https://localhost:5000/login', { email, password });
      console.log(response.data);
      if (response.data.access_token) {
        // Save the token to localStorage or context
        localStorage.setItem('token', response.data.access_token);
        // Navigate to the dashboard
        navigate('/profile');
      }
    } catch (error) {
      console.error(error);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default LoginPage;
