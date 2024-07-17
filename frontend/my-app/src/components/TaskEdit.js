import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Box, Typography, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

function TaskEdit() {
    const [taskData, setTaskData] = useState({
        header: '',
        details: '',
        status: 'todo',
        owner: ''
    });
    const [interns, setInterns] = useState([]);
    const [error, setError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();
    const { taskId } = useParams();

    useEffect(() => {
        const fetchUserRole = async () => {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            try {
                const response = await axios.get('https://localhost:5000/profile', config);
                if (response.data.role !== 'admin') {
                    navigate('/projects');
                    return;
                }
                setIsAdmin(true);
            } catch (error) {
                console.error('Error fetching user role:', error);
                navigate('/projects');
            }
        };

        const fetchTask = async () => {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            try {
                const response = await axios.get(`https://localhost:5000/get_task/${taskId}`, config);
                setTaskData(response.data);
            } catch (error) {
                console.error('Error fetching task:', error);
            }
        };

        const fetchInterns = async () => {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            try {
                const response = await axios.get('https://localhost:5000/interns', config);
                setInterns(response.data);
            } catch (error) {
                console.error('Error fetching interns:', error);
            }
        };

        fetchUserRole();
        fetchTask();
        fetchInterns();
    }, [taskId, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTaskData((prevTaskData) => ({
            ...prevTaskData,
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
            await axios.put(`https://localhost:5000/update_task/${taskId}`, taskData, config);
            alert('Task updated successfully!');
            navigate('/projects');
        } catch (error) {
            setError(error.response.data.error);
        }
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                    Edit Task
                </Typography>
                {error && <Alert severity="error">{error}</Alert>}
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Task Header"
                        name="header"
                        value={taskData.header}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Task Details"
                        name="details"
                        value={taskData.details}
                        onChange={handleChange}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Status</InputLabel>
                        <Select
                            name="status"
                            value={taskData.status}
                            onChange={handleChange}
                            label="Status"
                        >
                            <MenuItem value="todo">TODO</MenuItem>
                            <MenuItem value="test">TEST</MenuItem>
                            <MenuItem value="done">DONE</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Owner</InputLabel>
                        <Select
                            name="owner"
                            value={taskData.owner}
                            onChange={handleChange}
                            label="Owner"
                        >
                            {interns.map((intern) => (
                                <MenuItem key={intern.email} value={intern.email}>
                                    {intern.name} {intern.surname}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Update Task
                    </Button>
                </form>
            </Box>
        </Container>
    );
}

export default TaskEdit;
