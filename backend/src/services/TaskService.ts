import Task, { TaskDocument } from '../models/Task';
import { TaskFilters, CreateTaskRequest, UpdateTaskRequest, DragDropResult } from '@shared/types';
import { Types } from 'mongoose';

export class TaskService {
  static async getTasks(userId: string, filters: TaskFilters = {}): Promise<TaskDocument[]> {
    const query: any = { user: new Types.ObjectId(userId) };
    
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    
    const sort = filters.sort || '-createdAt';
    
    return await Task.find(query).sort(sort).lean().exec() as TaskDocument[];
  }

  static async getTask(taskId: string, userId: string): Promise<TaskDocument | null> {
    return await Task.findOne({ 
      _id: new Types.ObjectId(taskId), 
      user: new Types.ObjectId(userId) 
    }).lean().exec() as TaskDocument | null;
  }

  static async createTask(taskData: CreateTaskRequest, userId: string): Promise<TaskDocument> {
    // Get the highest position for the status to append new task
    const lastTask = await Task.findOne({ 
      user: new Types.ObjectId(userId), 
      status: taskData.status || 'todo' 
    }).sort({ position: -1 }).lean().exec();
    
    const position = lastTask ? lastTask.position + 1 : 0;
    
    const newTask = await Task.create({
      ...taskData,
      user: new Types.ObjectId(userId),
      position
    });

    return newTask.toObject() as TaskDocument;
  }

  static async updateTask(
    taskId: string, 
    userId: string, 
    updateData: UpdateTaskRequest
  ): Promise<TaskDocument | null> {
    const updated = await Task.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(taskId), 
        user: new Types.ObjectId(userId) 
      },
      updateData,
      { new: true, runValidators: true, lean: true }
    ).exec();

    return updated as TaskDocument | null;
  }

  static async deleteTask(taskId: string, userId: string): Promise<TaskDocument | null> {
    const deleted = await Task.findOneAndDelete({ 
      _id: new Types.ObjectId(taskId), 
      user: new Types.ObjectId(userId) 
    }).lean().exec();

    return deleted as TaskDocument | null;
  }

  static async reorderTasks(
    userId: string, 
    dragResult: DragDropResult
  ): Promise<{ updated: TaskDocument[]; task: TaskDocument }> {
    const { from, to, task } = dragResult;
    
    // Update the moved task
    const updatedTask = await Task.findOneAndUpdate(
      { _id: new Types.ObjectId(task._id), user: new Types.ObjectId(userId) },
      { 
        status: to.status, 
        position: to.index 
      },
      { new: true, lean: true }
    ).exec();
    
    if (!updatedTask) {
      throw new Error('Task not found');
    }
    
    // For simplicity, just return the updated task
    // In a real app, you'd want to update positions of other affected tasks
    const allTasks = await Task.find({ 
      user: new Types.ObjectId(userId) 
    }).sort({ position: 1 }).lean().exec();
    
    return {
      updated: allTasks as TaskDocument[],
      task: updatedTask as TaskDocument
    };
  }
}