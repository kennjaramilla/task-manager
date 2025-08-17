import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Task from '../../../src/models/Task';
import User from '../../../src/models/User';
import { TaskService } from '../../../src/services/TaskService';
import { CreateTaskRequest } from '@shared/types';

describe('TaskService', () => {
  let mongoServer: MongoMemoryServer;
  let userId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Task.deleteMany({});
    await User.deleteMany({});
    
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    userId = user._id.toString();
  });

  describe('createTask', () => {
    it('should create a task with correct position', async () => {
      const taskData: CreateTaskRequest = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        status: 'todo'
      };

      const task = await TaskService.createTask(taskData, userId);

      expect(task.title).toBe(taskData.title);
      expect(task.position).toBe(0);
      expect(task.user.toString()).toBe(userId);
    });

    it('should increment position for subsequent tasks', async () => {
      const taskData: CreateTaskRequest = {
        title: 'Test Task',
        status: 'todo'
      };

      const task1 = await TaskService.createTask(taskData, userId);
      const task2 = await TaskService.createTask({ ...taskData, title: 'Task 2' }, userId);

      expect(task1.position).toBe(0);
      expect(task2.position).toBe(1);
    });
  });

  describe('getTasks', () => {
    beforeEach(async () => {
      await Task.create([
        { title: 'Task 1', user: userId, status: 'todo', priority: 'high' },
        { title: 'Task 2', user: userId, status: 'in-progress', priority: 'low' },
        { title: 'Task 3', user: userId, status: 'completed', priority: 'medium' }
      ]);
    });

    it('should return all tasks for user', async () => {
      const tasks = await TaskService.getTasks(userId);
      expect(tasks).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const tasks = await TaskService.getTasks(userId, { status: 'todo' });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].status).toBe('todo');
    });

    it('should filter by priority', async () => {
      const tasks = await TaskService.getTasks(userId, { priority: 'high' });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].priority).toBe('high');
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const task = await Task.create({
        title: 'Original Title',
        user: userId,
        status: 'todo'
      });

      // Convert to string explicitly
      const taskId = String(task._id);

      const updated = await TaskService.updateTask(
        taskId,
        userId,
        { title: 'Updated Title', status: 'in-progress' }
      );

      expect(updated?.title).toBe('Updated Title');
      expect(updated?.status).toBe('in-progress');
    });

    it('should return null for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updated = await TaskService.updateTask(
        fakeId,
        userId,
        { title: 'Updated' }
      );

      expect(updated).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const task = await Task.create({
        title: 'Task to Delete',
        user: userId,
        status: 'todo'
      });

      // Convert to string explicitly
      const taskId = String(task._id);

      const deleted = await TaskService.deleteTask(taskId, userId);
      
      expect(deleted).toBeTruthy();
      // Use type assertion to access _id
      expect(String((deleted as any)._id)).toBe(taskId);

      // Verify task is actually deleted
      const found = await Task.findById(taskId);
      expect(found).toBeNull();
    });

    it('should return null for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const deleted = await TaskService.deleteTask(fakeId, userId);

      expect(deleted).toBeNull();
    });
  });

  describe('getTask', () => {
    it('should get task by id', async () => {
      const task = await Task.create({
        title: 'Single Task',
        description: 'Task Description',
        user: userId,
        status: 'todo',
        priority: 'medium'
      });

      // Convert to string explicitly
      const taskId = String(task._id);

      const found = await TaskService.getTask(taskId, userId);
      
      expect(found).toBeTruthy();
      expect(found?.title).toBe('Single Task');
      expect(found?.description).toBe('Task Description');
    });

    it('should return null for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const found = await TaskService.getTask(fakeId, userId);

      expect(found).toBeNull();
    });

    it('should return null for task belonging to different user', async () => {
      const task = await Task.create({
        title: 'Private Task',
        user: userId,
        status: 'todo'
      });

      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });

      const taskId = String(task._id);
      const otherUserId = String(otherUser._id);

      const found = await TaskService.getTask(taskId, otherUserId);
      expect(found).toBeNull();
    });
  });
});