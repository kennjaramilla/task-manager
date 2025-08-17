import { createStore, Store } from 'vuex'
import { InjectionKey } from 'vue'
import { 
  User, 
  Task, 
  TaskFilters, 
  CreateTaskRequest, 
  UpdateTaskRequest,
  DragDropResult,
  TaskStatus,
  TaskPriority
} from '@shared/types'
import apiService from '@/services/api'

export interface RootState {
  // Auth state
  user: User | null
  isAuthenticated: boolean
  authLoading: boolean
  
  // Task state
  tasks: Task[]
  tasksLoading: boolean
  currentTask: Task | null
  filters: TaskFilters
  
  // UI state
  error: string | null
  success: string | null
}

export interface TaskStats {
  total: number
  todo: number
  inProgress: number
  completed: number
  byPriority: {
    low: number
    medium: number
    high: number
  }
}

// Mutation types
export enum MutationType {
  // Auth mutations
  SET_AUTH_LOADING = 'SET_AUTH_LOADING',
  SET_USER = 'SET_USER',
  CLEAR_AUTH = 'CLEAR_AUTH',
  
  // Task mutations
  SET_TASKS_LOADING = 'SET_TASKS_LOADING',
  SET_TASKS = 'SET_TASKS',
  ADD_TASK = 'ADD_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  SET_CURRENT_TASK = 'SET_CURRENT_TASK',
  SET_FILTERS = 'SET_FILTERS',
  REORDER_TASKS = 'REORDER_TASKS',
  
  // UI mutations
  SET_ERROR = 'SET_ERROR',
  SET_SUCCESS = 'SET_SUCCESS',
  CLEAR_MESSAGES = 'CLEAR_MESSAGES'
}

// Action types
export enum ActionType {
  // Auth actions
  LOGIN = 'login',
  REGISTER = 'register',
  LOGOUT = 'logout',
  FETCH_PROFILE = 'fetchProfile',
  
  // Task actions
  FETCH_TASKS = 'fetchTasks',
  CREATE_TASK = 'createTask',
  UPDATE_TASK = 'updateTask',
  DELETE_TASK = 'deleteTask',
  SET_FILTERS = 'setFilters',
  REORDER_TASKS = 'reorderTasks',
  
  // UI actions
  SHOW_ERROR = 'showError',
  SHOW_SUCCESS = 'showSuccess',
  CLEAR_MESSAGES = 'clearMessages'
}

const store = createStore<RootState>({
  state: {
    // Auth state
    user: null,
    isAuthenticated: false,
    authLoading: false,
    
    // Task state
    tasks: [],
    tasksLoading: false,
    currentTask: null,
    filters: {
      status: undefined,
      priority: undefined,
      sort: '-createdAt'
    },
    
    // UI state
    error: null,
    success: null
  },

  mutations: {
    // Auth mutations
    [MutationType.SET_AUTH_LOADING](state, loading: boolean) {
      state.authLoading = loading
    },
    
    [MutationType.SET_USER](state, user: User) {
      state.user = user
      state.isAuthenticated = true
    },
    
    [MutationType.CLEAR_AUTH](state) {
      state.user = null
      state.isAuthenticated = false
      state.tasks = []
    },

    // Task mutations
    [MutationType.SET_TASKS_LOADING](state, loading: boolean) {
      state.tasksLoading = loading
    },
    
    [MutationType.SET_TASKS](state, tasks: Task[]) {
      state.tasks = tasks.sort((a, b) => {
        if (a.status !== b.status) {
          const statusOrder = { 'todo': 0, 'in-progress': 1, 'completed': 2 }
          return statusOrder[a.status] - statusOrder[b.status]
        }
        return a.position - b.position
      })
    },
    
    [MutationType.ADD_TASK](state, task: Task) {
      state.tasks.unshift(task)
    },
    
    [MutationType.UPDATE_TASK](state, updatedTask: Task) {
      const index = state.tasks.findIndex(task => task._id === updatedTask._id)
      if (index !== -1) {
        state.tasks.splice(index, 1, updatedTask)
      }
    },
    
    [MutationType.DELETE_TASK](state, taskId: string) {
      state.tasks = state.tasks.filter(task => task._id !== taskId)
    },
    
    [MutationType.SET_CURRENT_TASK](state, task: Task | null) {
      state.currentTask = task
    },
    
    [MutationType.SET_FILTERS](state, filters: Partial<TaskFilters>) {
      state.filters = { ...state.filters, ...filters }
    },
    
    [MutationType.REORDER_TASKS](state, { updated, task }: { updated: Task[]; task: Task }) {
      // Update the moved task
      const taskIndex = state.tasks.findIndex(t => t._id === task._id)
      if (taskIndex !== -1) {
        state.tasks.splice(taskIndex, 1, task)
      }
      
      // Update other affected tasks
      updated.forEach(updatedTask => {
        if (updatedTask._id !== task._id) {
          const index = state.tasks.findIndex(t => t._id === updatedTask._id)
          if (index !== -1) {
            state.tasks.splice(index, 1, updatedTask)
          }
        }
      })
      
      // Re-sort tasks
      state.tasks.sort((a, b) => {
        if (a.status !== b.status) {
          const statusOrder = { 'todo': 0, 'in-progress': 1, 'completed': 2 }
          return statusOrder[a.status] - statusOrder[b.status]
        }
        return a.position - b.position
      })
    },

    // UI mutations
    [MutationType.SET_ERROR](state, error: string) {
      state.error = error
      state.success = null
    },
    
    [MutationType.SET_SUCCESS](state, success: string) {
      state.success = success
      state.error = null
    },
    
    [MutationType.CLEAR_MESSAGES](state) {
      state.error = null
      state.success = null
    }
  },

  actions: {
    // Auth actions
    async [ActionType.LOGIN]({ commit }, credentials) {
      commit(MutationType.SET_AUTH_LOADING, true)
      try {
        const response = await apiService.login(credentials)
        localStorage.setItem('token', response.token)
        commit(MutationType.SET_USER, response.data.user)
        commit(MutationType.SET_SUCCESS, 'Login successful!')
        return response
      } catch (error: any) {
        const message = error.response?.data?.message || 'Login failed'
        commit(MutationType.SET_ERROR, message)
        throw error
      } finally {
        commit(MutationType.SET_AUTH_LOADING, false)
      }
    },

    async [ActionType.REGISTER]({ commit }, userData) {
      commit(MutationType.SET_AUTH_LOADING, true)
      try {
        const response = await apiService.register(userData)
        localStorage.setItem('token', response.token)
        commit(MutationType.SET_USER, response.data.user)
        commit(MutationType.SET_SUCCESS, 'Registration successful!')
        return response
      } catch (error: any) {
        const message = error.response?.data?.message || 'Registration failed'
        commit(MutationType.SET_ERROR, message)
        throw error
      } finally {
        commit(MutationType.SET_AUTH_LOADING, false)
      }
    },

    [ActionType.LOGOUT]({ commit }) {
      localStorage.removeItem('token')
      commit(MutationType.CLEAR_AUTH)
      commit(MutationType.SET_SUCCESS, 'Logged out successfully')
    },

    async [ActionType.FETCH_PROFILE]({ commit }) {
      try {
        const response = await apiService.getProfile()
        commit(MutationType.SET_USER, response.data.user)
      } catch (error) {
        localStorage.removeItem('token')
        commit(MutationType.CLEAR_AUTH)
      }
    },

    // Task actions
    async [ActionType.FETCH_TASKS]({ commit, state }) {
      commit(MutationType.SET_TASKS_LOADING, true)
      try {
        const response = await apiService.getTasks(state.filters)
        commit(MutationType.SET_TASKS, response.data.tasks)
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to fetch tasks'
        commit(MutationType.SET_ERROR, message)
      } finally {
        commit(MutationType.SET_TASKS_LOADING, false)
      }
    },

    async [ActionType.CREATE_TASK]({ commit }, taskData: CreateTaskRequest) {
      try {
        const response = await apiService.createTask(taskData)
        commit(MutationType.ADD_TASK, response.data.task)
        commit(MutationType.SET_SUCCESS, 'Task created successfully!')
        return response.data.task
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to create task'
        commit(MutationType.SET_ERROR, message)
        throw error
      }
    },

    async [ActionType.UPDATE_TASK]({ commit }, { id, taskData }: { id: string; taskData: UpdateTaskRequest }) {
      try {
        const response = await apiService.updateTask(id, taskData)
        commit(MutationType.UPDATE_TASK, response.data.task)
        commit(MutationType.SET_SUCCESS, 'Task updated successfully!')
        return response.data.task
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to update task'
        commit(MutationType.SET_ERROR, message)
        throw error
      }
    },

    async [ActionType.DELETE_TASK]({ commit }, taskId: string) {
      try {
        await apiService.deleteTask(taskId)
        commit(MutationType.DELETE_TASK, taskId)
        commit(MutationType.SET_SUCCESS, 'Task deleted successfully!')
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to delete task'
        commit(MutationType.SET_ERROR, message)
        throw error
      }
    },

    [ActionType.SET_FILTERS]({ commit, dispatch }, filters: Partial<TaskFilters>) {
      commit(MutationType.SET_FILTERS, filters)
      dispatch(ActionType.FETCH_TASKS)
    },

    async [ActionType.REORDER_TASKS]({ commit, dispatch }, dragResult: DragDropResult) {
      try {
          // Optimistic update
          const result = await apiService.reorderTasks(dragResult)
          commit(MutationType.REORDER_TASKS, result)
      } catch (error: any) {
          const message = error.response?.data?.message || 'Failed to reorder tasks'
          commit(MutationType.SET_ERROR, message)
          // Revert by refetching tasks
          dispatch(ActionType.FETCH_TASKS)
          throw error
      }
    },

    // UI actions
    [ActionType.SHOW_ERROR]({ commit }, message: string) {
      commit(MutationType.SET_ERROR, message)
    },

    [ActionType.SHOW_SUCCESS]({ commit }, message: string) {
      commit(MutationType.SET_SUCCESS, message)
    },

    [ActionType.CLEAR_MESSAGES]({ commit }) {
      commit(MutationType.CLEAR_MESSAGES)
    }
  },

  getters: {
    tasksByStatus: (state) => (status: TaskStatus) => {
      return state.tasks
        .filter(task => task.status === status)
        .sort((a, b) => a.position - b.position)
    },

    taskStats: (state): TaskStats => {
      const stats = state.tasks.reduce((acc, task) => {
        acc.total++
        acc[task.status === 'in-progress' ? 'inProgress' : task.status]++
        acc.byPriority[task.priority]++
        return acc
      }, {
        total: 0,
        todo: 0,
        inProgress: 0,
        completed: 0,
        byPriority: { low: 0, medium: 0, high: 0 }
      })

      return stats
    },

    filteredTasks: (state) => {
      let filtered = [...state.tasks]

      if (state.filters.status) {
        filtered = filtered.filter(task => task.status === state.filters.status)
      }

      if (state.filters.priority) {
        filtered = filtered.filter(task => task.priority === state.filters.priority)
      }

      return filtered
    },

    isLoading: (state) => state.authLoading || state.tasksLoading
  }
})

// Define injection key
export const key: InjectionKey<Store<RootState>> = Symbol()

export default store