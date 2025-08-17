import express from 'express';
import { TaskController } from '../controllers/TaskController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(TaskController.getTasks)
  .post(TaskController.validateCreateTask, TaskController.createTask);

router.route('/:id')
  .get(TaskController.getTask)
  .put(TaskController.updateTask)
  .delete(TaskController.deleteTask);

router.put('/reorder', TaskController.reorderTasks);

export default router;