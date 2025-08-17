import mongoose, { Document, Schema } from 'mongoose';
import { Task as ITask, TaskPriority, TaskStatus } from '@shared/types';

export interface TaskDocument extends Omit<ITask, '_id'>, Document {}

const taskSchema = new Schema<TaskDocument>({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'] as TaskPriority[],
      message: 'Priority must be low, medium, or high'
    },
    default: 'medium'
  },
  status: {
    type: String,
    enum: {
      values: ['todo', 'in-progress', 'completed'] as TaskStatus[],
      message: 'Status must be todo, in-progress, or completed'
    },
    default: 'todo'
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value: Date) {
        return !value || value > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  position: {
    type: Number,
    default: 0
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must belong to a user']
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
taskSchema.index({ user: 1, status: 1, position: 1 });
taskSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<TaskDocument>('Task', taskSchema);