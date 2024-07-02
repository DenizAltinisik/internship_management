import React, { useState } from 'react';
import axios from 'axios';

function Home() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/add_user', {
        name,
        surname,
      });
      alert(response.data.message);
      setName('');
      setSurname('');
    } catch (error) {
      console.error('There was an error adding the user!', error);
      alert('Error: ' + error.response.data.error);
    }
  };

  return (
    <div className="Home">
      <h1>Add User</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label>Last Name:</label>
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Home;
