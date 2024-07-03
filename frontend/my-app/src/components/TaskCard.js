import React from 'react';
import { useDrag } from 'react-dnd';

const TaskCard = ({ task }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { _id: task._id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="task-card"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <h3>{task.name}</h3>
      <p>{task.description}</p>
    </div>
  );
};

export default TaskCard;
