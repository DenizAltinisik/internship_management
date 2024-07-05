import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableRow, Paper, Button, TextField } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './css/Dashboard.css';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [newTaskHeader, setNewTaskHeader] = useState('');
  const [newTaskDetails, setNewTaskDetails] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('https://localhost:5000/tasks', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        });
        const updatedTasks = response.data.map(task => ({ ...task, color: getRandomColor() }));
        setTasks(updatedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchTasks();
  }, []);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const updatedTasks = [...tasks];
    const task = updatedTasks.find((task) => task.id === draggableId);
    updatedTasks.splice(source.index, 1);
    updatedTasks.splice(destination.index, 0, { ...task, status: destination.droppableId });
    setTasks(updatedTasks);
  };

  const handleAddTask = async () => {
    if (newTaskHeader.trim() === '' || newTaskDetails.trim() === '') {
      console.log('Task header or details are empty');
      return;
    }
  
    const newTaskObj = {
      header: newTaskHeader,
      details: newTaskDetails,
      status: 'todo',
    };
  
    console.log('Sending new task:', newTaskObj);
  
    try {
      const response = await axios.post('https://localhost:5000/addTask', newTaskObj, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' },
      });
  
      console.log('Response:', response);
  
      if (response.status === 201) {
        setTasks([...tasks, { ...newTaskObj, id: `task${tasks.length + 1}`, color: getRandomColor() }]);
        setNewTaskHeader('');
        setNewTaskDetails('');
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

  const moveForward = (taskId) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        switch (task.status) {
          case 'todo':
            return { ...task, status: 'test' };
          case 'test':
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
      if (task.id === taskId) {
        switch (task.status) {
          case 'done':
            return { ...task, status: 'test' };
          case 'test':
            return { ...task, status: 'todo' };
          default:
            return task;
        }
      }
      return task;
    });

    setTasks(updatedTasks);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Tasks
          </Typography>
          <Box sx={{ display: 'flex', gap: '10px' }}>
            <TextField label="Task Header" variant="outlined" size="small" value={newTaskHeader} onChange={(e) => handleInputChange(e, 'header')} />
            <TextField label="Task Details" variant="outlined" size="small" value={newTaskDetails} onChange={(e) => handleInputChange(e, 'details')} />
            <Button variant="contained" onClick={handleAddTask}>Add New Task</Button>
          </Box>
        </Box>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Box sx={{ display: 'flex', gap: '20px' }}>
            {['todo', 'test', 'done'].map((status) => (
              <Box key={status} sx={{ flex: '1 1 30%' }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  {status.toUpperCase()}
                </Typography>
                <Droppable droppableId={status} key={status}>
                  {(provided) => (
                    <TableContainer component={Paper} {...provided.droppableProps} innerRef={provided.innerRef}>
                      <Table>
                        <TableBody>
                          {tasks.filter((task) => task.status === status).map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided) => (
                                <TableRow ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`task-card ${status}`}>
                                  <TableCell>
                                    <Typography variant="subtitle1">{task.header}</Typography>
                                    <Typography variant="body2">{task.details}</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                      {task.status === 'todo' && <Button variant="outlined" size="small" onClick={() => moveForward(task.id)}>Move to Test</Button>}
                                      {task.status === 'test' && (
                                        <>
                                          <Button variant="outlined" size="small" onClick={() => moveBackward(task.id)}>Back to To Do</Button>
                                          <Button variant="outlined" size="small" onClick={() => moveForward(task.id)}>Move to Done</Button>
                                        </>
                                      )}
                                      {task.status === 'done' && <Button variant="outlined" size="small" onClick={() => moveBackward(task.id)}>Back to Test</Button>}
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
                  )}
                </Droppable>
              </Box>
            ))}
          </Box>
        </DragDropContext>
      </Box>
    </Container>
  );
};

export default Dashboard;