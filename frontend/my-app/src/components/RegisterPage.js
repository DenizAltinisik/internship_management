import React, { useState } from 'react';
import axios from 'axios';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [department, setDepartment] = useState('');

  const handleRegister = async () => {
    try {
      const response = await axios.post('https://localhost:5000/register', { email, password, name, surname, phone, school, department});
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br></br>
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br></br>
      <input
        type="name"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br></br>
      <input
        type="surname"
        placeholder="Surname"
        value={surname}
        onChange={(e) => setSurname(e.target.value)}
      />
      <br></br>
      <input
        type="phone"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <br></br>
      <input
        type="school"
        placeholder="School"
        value={school}
        onChange={(e) => setSchool(e.target.value)}
      />
      <br></br>
      <input
        type="department"
        placeholder="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
      />
      <br></br>
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

export default RegisterPage;
