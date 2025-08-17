import { describe, it, expect, beforeEach, vi } from 'vitest';
import store from '@/store';
import { ActionType, MutationType } from '@/store';
import apiService from '@/services/api';

// Mock API service
vi.mock('@/services/api', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn()
  }
}));

describe('Vuex Store', () => {
  beforeEach(() => {
    // Reset store state
    store.commit(MutationType.CLEAR_AUTH);
    store.commit(MutationType.SET_TASKS, []);
    vi.clearAllMocks();
  });

  describe('Auth Actions', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        success: true,
        token: 'mock-token',
        data: {
          user: {
            _id: '1',
            name: 'Test User',
            email: 'test@example.com',
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01'
          }
        }
      };

      vi.mocked(apiService.login).mockResolvedValue(mockResponse);

      await store.dispatch(ActionType.LOGIN, {
        email: 'test@example.com',
        password: 'password'
      });

      expect(store.state.isAuthenticated).toBe(true);
      expect(store.state.user?.name).toBe('Test User');
    });

    it('should handle login failure', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials'
          }
        }
      };

      vi.mocked(apiService.login).mockRejectedValue(mockError);

      try {
        await store.dispatch(ActionType.LOGIN, {
          email: 'test@example.com',
          password: 'wrong'
        });
      } catch (error) {
        expect(store.state.error).toBe('Invalid credentials');
        expect(store.state.isAuthenticated).toBe(false);
      }
    });
  });

  describe('Task Actions', () => {
    it('should create task successfully', async () => {
      const mockTask = {
        _id: '1',
        title: 'New Task',
        description: 'Description',
        priority: 'medium' as const,
        status: 'todo' as const,
        user: 'user1',
        position: 0,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      };

      const mockResponse = {
        success: true,
        data: { task: mockTask }
      };

      vi.mocked(apiService.createTask).mockResolvedValue(mockResponse);

      await store.dispatch(ActionType.CREATE_TASK, {
        title: 'New Task',
        description: 'Description'
      });

      expect(store.state.tasks).toHaveLength(1);
      expect(store.state.tasks[0].title).toBe('New Task');
    });

    it('should update task successfully', async () => {
      // Add initial task
      const initialTask = {
        _id: '1',
        title: 'Original Task',
        description: '',
        priority: 'medium' as const,
        status: 'todo' as const,
        user: 'user1',
        position: 0,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      };

      store.commit(MutationType.SET_TASKS, [initialTask]);

      const updatedTask = {
        ...initialTask,
        title: 'Updated Task',
        status: 'completed' as const
      };

      const mockResponse = {
        success: true,
        data: { task: updatedTask }
      };

      vi.mocked(apiService.updateTask).mockResolvedValue(mockResponse);

      await store.dispatch(ActionType.UPDATE_TASK, {
        id: '1',
        taskData: { title: 'Updated Task', status: 'completed' }
      });

      expect(store.state.tasks[0].title).toBe('Updated Task');
      expect(store.state.tasks[0].status).toBe('completed');
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      const mockTasks = [
        {
          _id: '1',
          title: 'Todo Task',
          description: '',
          priority: 'high' as const,
          status: 'todo' as const,
          user: 'user1',
          position: 0,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        },
        {
          _id: '2',
          title: 'In Progress Task',
          description: '',
          priority: 'medium' as const,
          status: 'in-progress' as const,
          user: 'user1',
          position: 0,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        },
        {
          _id: '3',
          title: 'Completed Task',
          description: '',
          priority: 'low' as const,
          status: 'completed' as const,
          user: 'user1',
          position: 0,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01'
        }
      ];

      store.commit(MutationType.SET_TASKS, mockTasks);
    });

    it('should return tasks by status', () => {
      const todoTasks = store.getters.tasksByStatus('todo');
      const inProgressTasks = store.getters.tasksByStatus('in-progress');
      const completedTasks = store.getters.tasksByStatus('completed');

      expect(todoTasks).toHaveLength(1);
      expect(inProgressTasks).toHaveLength(1);
      expect(completedTasks).toHaveLength(1);
    });

    it('should calculate task statistics correctly', () => {
      const stats = store.getters.taskStats;

      expect(stats.total).toBe(3);
      expect(stats.todo).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
      expect(stats.byPriority.low).toBe(1);
    });
  });
});