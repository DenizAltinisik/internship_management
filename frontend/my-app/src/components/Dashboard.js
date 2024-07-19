import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableRow, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import './css/Dashboard.css';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [interns, setInterns] = useState([]);
    const [userNames, setUserNames] = useState({});
    const [newTaskHeader, setNewTaskHeader] = useState('');
    const [newTaskDetails, setNewTaskDetails] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedIntern, setSelectedIntern] = useState('');
    const [selectedProjectForView, setSelectedProjectForView] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await axios.get('http://localhost:5000/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(response.data);
                if (response.data.role === 'admin') {
                    fetchInterns(token);
                }
            } catch (error) {
                console.error(error);
                alert('Failed to fetch profile data.');
                navigate('/login');
            }
        };

        const fetchTasks = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await axios.get('http://localhost:5000/tasks', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTasks(response.data);
            } catch (error) {
                console.error(error);
                alert('Failed to fetch tasks.');
            }
        };

        const fetchProjects = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await axios.get('http://localhost:5000/get_projects', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(response.data);
            } catch (error) {
                console.error(error);
                alert('Failed to fetch projects.');
            }
        };

        const fetchInterns = async (token) => {
            try {
                const response = await axios.get('http://localhost:5000/interns', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setInterns(response.data);
            } catch (error) {
                console.error('Failed to fetch interns:', error);
            }
        };

        const fetchUserNames = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get('http://localhost:5000/get_user_names', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserNames(response.data);
            } catch (error) {
                console.error('Failed to fetch user names:', error);
            }
        };

        fetchProfile();
        fetchTasks();
        fetchProjects();
        fetchUserNames();
    }, [navigate]);

    const handleDragEnd = (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const updatedTasks = [...tasks];
        const task = updatedTasks.find((task) => task._id === draggableId);
        updatedTasks.splice(source.index, 1);
        updatedTasks.splice(destination.index, 0, { ...task, status: destination.droppableId });
        setTasks(updatedTasks);

        handleCurrentTask(draggableId, destination.droppableId);
    };

    const handleAddTask = async () => {
        if (newTaskHeader.trim() === '' || newTaskDetails.trim() === '' || selectedProject.trim() === '' || (user.role === 'admin' && selectedIntern.trim() === '')) {
            console.log('Task header, details, project, or intern is empty');
            return;
        }

        const newTaskObj = {
            header: newTaskHeader,
            details: newTaskDetails,
            status: 'todo',
            project_id: selectedProject,
            owner: user.role === 'admin' ? selectedIntern : user.email
        };

        console.log('Sending new task:', newTaskObj);

        try {
            const response = await axios.post('http://localhost:5000/addTask', newTaskObj, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
            });

            console.log('Response:', response);

            if (response.status === 201) {
                setTasks([...tasks, { ...newTaskObj, _id: response.data.task_id }]);
                setNewTaskHeader('');
                setNewTaskDetails('');
                setSelectedProject('');
                setSelectedIntern('');
                console.log('Task added successfully');
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const handleInputChange = (e, type) => {
        if (type === 'header') setNewTaskHeader(e.target.value);
        else if (type === 'details') setNewTaskDetails(e.target.value);
    };

    const handleCurrentTask = async (taskId, newStatus) => {
        try {
            const response = await axios.put('http://localhost:5000/update_task_status', { task_id: taskId, status: newStatus }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
            });

            if (response.status === 200) {
                console.log('Task status updated successfully');
            }
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const moveForward = (taskId) => {
        const updatedTasks = tasks.map(task => {
            if (task._id === taskId) {
                switch (task.status) {
                    case 'todo':
                        handleCurrentTask(taskId, 'test');
                        return { ...task, status: 'test' };
                    case 'test':
                        handleCurrentTask(taskId, 'done');
                        return { ...task, status: 'done' };
                    default:
                        return task;
                }
            }
            return task;
        });

        setTasks(updatedTasks);
    };

    const moveBackward = (taskId) => {
        const updatedTasks = tasks.map(task => {
            if (task._id === taskId) {
                switch (task.status) {
                    case 'done':
                        handleCurrentTask(taskId, 'test');
                        return { ...task, status: 'test' };
                    case 'test':
                        handleCurrentTask(taskId, 'todo');
                        return { ...task, status: 'todo' };
                    default:
                        return task;
                }
            }
            return task;
        });

        setTasks(updatedTasks);
    };

    const filteredTasks = selectedProjectForView ? tasks.filter(task => task.project_id === selectedProjectForView) : [];

    return (
        <Container maxWidth="lg" className="dashboard-container">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff' }}>
                    Dashboard
                </Typography>
                {user && user.role === 'admin' && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" component="h2" sx={{ color: '#fff' }}>
                            Add New Task
                        </Typography>
                        <Box sx={{ display: 'flex', gap: '10px' }}>
                            <TextField label="Task Header" variant="outlined" size="small" value={newTaskHeader} onChange={(e) => handleInputChange(e, 'header')} />
                            <TextField label="Task Details" variant="outlined" size="small" value={newTaskDetails} onChange={(e) => handleInputChange(e, 'details')} />
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Project</InputLabel>
                                <Select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    label="Project"
                                >
                                    {projects.map((project) => (
                                        <MenuItem key={project._id} value={project._id}>
                                            {project.project_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Assign to Intern</InputLabel>
                                <Select
                                    value={selectedIntern}
                                    onChange={(e) => setSelectedIntern(e.target.value)}
                                    label="Assign to Intern"
                                >
                                    {interns.map((intern) => (
                                        <MenuItem key={intern.email} value={intern.email}>
                                            {intern.name} {intern.surname}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button variant="contained" onClick={handleAddTask}>Add New Task</Button>
                        </Box>
                    </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Filter by Project</InputLabel>
                        <Select
                            value={selectedProjectForView}
                            onChange={(e) => setSelectedProjectForView(e.target.value)}
                            label="Filter by Project"
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {projects.map((project) => (
                                <MenuItem key={project._id} value={project._id}>
                                    {project.project_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Box sx={{ display: 'flex', gap: '20px' }}>
                        {['todo', 'test', 'done'].map((status) => (
                            <Droppable key={status} droppableId={status}>
                                {(provided) => (
                                    <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ flex: 1 }}>
                                        <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#fff' }}>
                                            {status.toUpperCase()}
                                        </Typography>
                                        <TableContainer component={Paper}>
                                            <Table>
                                                <TableBody>
                                                    {filteredTasks.filter((task) => task.status === status).map((task, index) => (
                                                        <Draggable key={task._id} draggableId={task._id} index={index}>
                                                            {(provided) => (
                                                                <TableRow
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`task-card ${status}`} // Apply status-specific class
                                                                >
                                                                    <TableCell>
                                                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{task.header}</Typography>
                                                                        <Typography variant="body2">{task.details}</Typography>
                                                                        <Typography variant="caption">Owner: {userNames[task.owner]}</Typography>
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                            {status !== 'done' && (
                                                                                <Button
                                                                                    variant="contained"
                                                                                    size="small"
                                                                                    sx={{
                                                                                        backgroundColor: 'transparent',
                                                                                        border: '1px solid black',
                                                                                        color: 'black',
                                                                                        '&:hover': {
                                                                                            backgroundColor: 'black',
                                                                                            color: 'white',
                                                                                        },
                                                                                    }}
                                                                                    onClick={() => moveForward(task._id)}
                                                                                >
                                                                                    Move Forward
                                                                                </Button>
                                                                            )}
                                                                            {status !== 'todo' && (
                                                                                <Button
                                                                                    variant="contained"
                                                                                    size="small"
                                                                                    sx={{
                                                                                        backgroundColor: 'transparent',
                                                                                        border: '1px solid black',
                                                                                        color: 'black',
                                                                                        '&:hover': {
                                                                                            backgroundColor: 'black',
                                                                                            color: 'white',
                                                                                        },
                                                                                    }}
                                                                                    onClick={() => moveBackward(task._id)}
                                                                                >
                                                                                    Move Backward
                                                                                </Button>
                                                                            )}
                                                                        </Box>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </Droppable>
                        ))}
                    </Box>
                </DragDropContext>
            </Box>
        </Container>
    );
};

export default Dashboard;
