import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AuthResponse,
  TaskResponse,
  TasksResponse,
  LoginRequest,
  RegisterRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  DragDropResult,
  ApiError,
  Task
} from '@shared/types';

// Use import.meta.env for Vite instead of process.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<AuthResponse> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Task endpoints
  async getTasks(filters?: TaskFilters): Promise<TasksResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.sort) params.append('sort', filters.sort);

    const response = await this.api.get(`/tasks?${params}`);
    return response.data;
  }

  async getTask(id: string): Promise<TaskResponse> {
    const response = await this.api.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(taskData: CreateTaskRequest): Promise<TaskResponse> {
    const response = await this.api.post('/tasks', taskData);
    return response.data;
  }

  async updateTask(id: string, taskData: UpdateTaskRequest): Promise<TaskResponse> {
    const response = await this.api.put(`/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.api.delete(`/tasks/${id}`);
  }

  async reorderTasks(dragResult: DragDropResult): Promise<{ updated: Task[]; task: Task }> {
    const response = await this.api.put('/tasks/reorder', dragResult);
    return response.data.data;
  }
}

export default new ApiService();