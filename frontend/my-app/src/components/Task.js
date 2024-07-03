// src/components/Task.js
import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';

const Task = ({ task }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TASK,
    item: task,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <div ref={drag} className="task" style={{ opacity: isDragging ? 0.5 : 1 }}>
      <h4>{task.task_name}</h4>
      <p>{task.task_description}</p>
    </div>
  );
};

export default Task;
