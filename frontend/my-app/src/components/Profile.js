import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'react-phone-input-2/lib/style.css';
import PhoneInput from 'react-phone-input-2';
import { TextField, Button, MenuItem, Select, InputLabel, FormControl, Container, Box, Typography } from '@mui/material';
import defaultProfilePicture from './assets/default-profile.png'; // Yolu güncelledik
import './Profile.css';

function Profile() {
  const [user, setUser] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    school: '',
    department: '',
    profile_picture: '',
    gender: '',
    birthdate: new Date().toISOString().substr(0, 10)
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handlePhoneChange = (value, data) => {
    setUser((prevUser) => ({
      ...prevUser,
      phone: value,
      countryCode: data.dialCode,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfilePictureFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUser((prevUser) => ({
        ...prevUser,
        profile_picture: reader.result,
      }));
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (const key in user) {
      formData.append(key, user[key]);
    }
    if (profilePictureFile) {
      formData.append('profile_picture', profilePictureFile);
    }

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/update_user/${user.email}`, formData);
        alert('User updated successfully!');
      } else {
        await axios.post('http://localhost:5000/add_user', formData);
        alert('User added successfully!');
      }
    } catch (error) {
      console.error('There was an error saving the user!', error);
      alert('Error: ' + error.response.data.error);
    }
  };

  const fetchUser = async (email) => {
    try {
      const response = await axios.get(`http://localhost:5000/get_user/${email}`);
      setUser(response.data);
      setIsEditing(true);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setIsEditing(false);
      } else {
        console.error('There was an error fetching the user!', error);
      }
    }
  };

  useEffect(() => {
    const email = prompt('Please enter your email to manage your profile');
    if (email) {
      fetchUser(email);
    }
  }, []);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditing ? 'Edit Profile' : 'Add Profile'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="First Name"
            name="name"
            value={user.name}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Last Name"
            name="surname"
            value={user.surname}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={user.email}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <label>Phone:</label>
            <PhoneInput
              country={'us'}
              value={user.phone}
              onChange={handlePhoneChange}
              inputStyle={{
                width: '100%',
                padding: '10px',
                paddingLeft: '58px', // Sol tarafı kesmek için padding ayarı
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
              containerStyle={{
                width: '100%',
                position: 'relative'
              }}
              buttonStyle={{
                position: 'absolute', // Ülke bayrağı ve kodunun konumunu ayarlamak için
                left: '0',
                top: '0',
                height: '100%',
                borderRadius: '5px 0 0 5px',
                border: '1px solid #ccc'
              }}
              dropdownStyle={{
                borderRadius: '5px',
                border: '1px solid #ccc',
                zIndex: 1000
              }}
              enableSearch={true}
              disableSearchIcon={true}
            />
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="School"
            name="school"
            value={user.school}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Department"
            name="department"
            value={user.department}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Gender</InputLabel>
            <Select
              name="gender"
              value={user.gender}
              onChange={handleChange}
              label="Gender"
            >
              <MenuItem value=""><em>Select</em></MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Birthdate"
            name="birthdate"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={user.birthdate}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <label htmlFor="profile_picture">
              <input
                style={{ display: 'none' }}
                id="profile_picture"
                name="profile_picture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button variant="contained" component="span">
                Upload Profile Picture
              </Button>
            </label>
            {user.profile_picture && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={user.profile_picture || defaultProfilePicture}
                  alt="Profile"
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '10px', border: '2px solid #ccc' }}
                />
              </Box>
            )}
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            {isEditing ? 'Update' : 'Add'} Profile
          </Button>
        </form>
      </Box>
    </Container>
  );
}

export default Profile;
