import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { TaskService } from '../services/TaskService';
import { AuthRequest } from '../middleware/auth';
import { CreateTaskRequest, UpdateTaskRequest, DragDropResult } from '@shared/types';

export class TaskController {
  static validateCreateTask = [
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('status')
      .optional()
      .isIn(['todo', 'in-progress', 'completed'])
      .withMessage('Status must be todo, in-progress, or completed'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date')
  ];

  static async getTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Type assertion to ensure user exists (middleware guarantees this)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const filters = {
        status: req.query.status as any,
        priority: req.query.priority as any,
        sort: req.query.sort as string
      };
      
      // Now req.user._id is properly typed as string (from UserDocument)
      const tasks = await TaskService.getTasks(req.user._id.toString(), filters);
      
      res.status(200).json({
        success: true,
        results: tasks.length,
        data: { tasks }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const task = await TaskService.getTask(req.params.id, req.user._id.toString());
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const taskData: CreateTaskRequest = req.body;
      const task = await TaskService.createTask(taskData, req.user._id.toString());
      
      res.status(201).json({
        success: true,
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const updateData: UpdateTaskRequest = req.body;
      const task = await TaskService.updateTask(
        req.params.id, 
        req.user._id.toString(), 
        updateData
      );
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const task = await TaskService.deleteTask(req.params.id, req.user._id.toString());
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      
      res.status(204).json({
        success: true,
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  static async reorderTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const dragResult: DragDropResult = req.body;
      const result = await TaskService.reorderTasks(req.user._id.toString(), dragResult);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}