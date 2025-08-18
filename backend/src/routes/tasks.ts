import express from 'express';
import { TaskController } from '../controllers/TaskController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Add protect middleware
router.use(protect);

// Protected routes with actual TaskController
router.get('/', TaskController.getTasks);
router.post('/', TaskController.createTask);

// Add other routes
router.get('/:id', TaskController.getTask);
router.put('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);
router.put('/reorder', TaskController.reorderTasks);

export default router;