export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  user: string | User; // Allow both string (ObjectId) and populated User
  position: number;
  createdAt: string;
  updatedAt: string;
}

// Add a separate interface for the document
export interface TaskDocument {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date; // Date object in document
  user: string; // ObjectId as string in document
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  position?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: {
    user: User;
  };
}

export interface TaskResponse {
  success: boolean;
  data: {
    task: Task;
  };
}

export interface TasksResponse {
  success: boolean;
  results: number;
  data: {
    tasks: Task[];
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  sort?: string;
}

export interface DragDropResult {
  from: {
    status: TaskStatus;
    index: number;
  };
  to: {
    status: TaskStatus;
    index: number;
  };
  task: Task;
}