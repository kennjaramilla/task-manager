<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="dashboard-title">Task Manager</h1>
          <p class="dashboard-subtitle">Welcome back, {{ user?.name }}!</p>
        </div>
        <div class="header-right">
          <button @click="logout" class="btn btn-secondary">
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon bg-blue-100">
            <DocumentTextIcon class="w-6 h-6 text-blue-600" />
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ taskStats.total }}</h3>
            <p class="stat-label">Total Tasks</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-yellow-100">
            <ClockIcon class="w-6 h-6 text-yellow-600" />
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ taskStats.todo }}</h3>
            <p class="stat-label">To Do</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-orange-100">
            <PlayIcon class="w-6 h-6 text-orange-600" />
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ taskStats.inProgress }}</h3>
            <p class="stat-label">In Progress</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-green-100">
            <CheckCircleIcon class="w-6 h-6 text-green-600" />
          </div>
          <div class="stat-content">
            <h3 class="stat-number">{{ taskStats.completed }}</h3>
            <p class="stat-label">Completed</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Controls Section -->
    <section class="controls-section">
      <div class="controls-content">
        <div class="controls-left">
          <button @click="openCreateModal" class="btn btn-primary">
            <PlusIcon class="w-4 h-4" />
            Add New Task
          </button>
          
          <div class="view-toggle">
            <button 
              @click="viewMode = 'board'"
              :class="['toggle-btn', { active: viewMode === 'board' }]"
            >
              Board
            </button>
            <button 
              @click="viewMode = 'list'"
              :class="['toggle-btn', { active: viewMode === 'list' }]"
            >
              List
            </button>
          </div>
        </div>

        <div class="controls-right">
          <div class="filters">
            <select v-model="filters.status" @change="applyFilters" class="filter-select">
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <select v-model="filters.priority" @change="applyFilters" class="filter-select">
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select v-model="filters.sort" @change="applyFilters" class="filter-select">
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Loading State -->
      <div v-if="tasksLoading" class="loading-state">
        <div class="loading-spinner-large"></div>
        <p>Loading tasks...</p>
      </div>

      <!-- Board View -->
      <TaskBoard
        v-else-if="viewMode === 'board'"
        :tasks="tasks"
        @edit-task="editTask"
        @delete-task="deleteTask"
        @view-task="viewTask"
        @add-task="openCreateModalWithStatus"
      />

      <!-- List View -->
      <div v-else class="list-view">
        <div v-if="filteredTasks.length === 0" class="empty-state">
          <DocumentTextIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p class="text-gray-500 mb-4">Get started by creating your first task.</p>
          <button @click="openCreateModal" class="btn btn-primary">
            <PlusIcon class="w-4 h-4" />
            Create Task
          </button>
        </div>

        <div v-else class="task-list">
          <TaskCard
            v-for="task in filteredTasks"
            :key="task._id"
            :task="task"
            @edit="editTask(task)"
            @delete="deleteTask(task._id)"
            @click="viewTask(task)"
            class="list-task-card"
          />
        </div>
      </div>
    </main>

    <!-- Modals -->
    <TaskModal
      v-if="showCreateModal || showEditModal"
      :task="currentTask"
      :is-edit="showEditModal"
      :loading="modalLoading"
      @save="saveTask"
      @close="closeModal"
    />

    <!-- Success/Error Messages -->
    <div v-if="success" class="notification success">
      <CheckCircleIcon class="w-5 h-5" />
      {{ success }}
    </div>

    <div v-if="error" class="notification error">
      <XCircleIcon class="w-5 h-5" />
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import {
  PlusIcon,
  DocumentTextIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline';
import TaskBoard from '@/components/TaskBoard.vue';
import TaskCard from '@/components/TaskCard.vue';
import TaskModal from '@/components/TaskModal.vue';
import { Task, TaskStatus, CreateTaskRequest, TaskFilters } from '@shared/types';
import { ActionType } from '@/store';

// Composables
const store = useStore();
const router = useRouter();

// State
const viewMode = ref<'board' | 'list'>('board');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const currentTask = ref<Task | null>(null);
const modalLoading = ref(false);

const filters = reactive<TaskFilters>({
  status: undefined,
  priority: undefined,
  sort: '-createdAt'
});

// Computed
const user = computed(() => store.state.user);
const tasks = computed(() => store.state.tasks);
const tasksLoading = computed(() => store.state.tasksLoading);
const taskStats = computed(() => store.getters.taskStats);
const filteredTasks = computed(() => store.getters.filteredTasks);
const success = computed(() => store.state.success);
const error = computed(() => store.state.error);

// Lifecycle
onMounted(async () => {
  await store.dispatch(ActionType.FETCH_PROFILE);
  await store.dispatch(ActionType.FETCH_TASKS);
  
  // Clear messages after 5 seconds
  setTimeout(() => {
    store.dispatch(ActionType.CLEAR_MESSAGES);
  }, 3001);
});

// Methods
const logout = (): void => {
  store.dispatch(ActionType.LOGOUT);
  router.push('/login');
};

const applyFilters = (): void => {
  store.dispatch(ActionType.SET_FILTERS, filters);
};

const openCreateModal = (): void => {
  currentTask.value = null;
  showCreateModal.value = true;
};

const openCreateModalWithStatus = (status: TaskStatus): void => {
  currentTask.value = null;
  showCreateModal.value = true;
  // You can pre-fill the status in the modal if needed
};

const editTask = (task: Task): void => {
  currentTask.value = task;
  showEditModal.value = true;
};

const viewTask = (task: Task): void => {
  // Could open a detailed view modal or navigate to task detail page
  console.log('View task:', task);
};

const deleteTask = async (taskId: string): Promise<void> => {
  if (confirm('Are you sure you want to delete this task?')) {
    try {
      await store.dispatch(ActionType.DELETE_TASK, taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }
};

const saveTask = async (taskData: CreateTaskRequest): Promise<void> => {
  modalLoading.value = true;
  try {
    if (showEditModal.value && currentTask.value) {
      await store.dispatch(ActionType.UPDATE_TASK, {
        id: currentTask.value._id,
        taskData
      });
    } else {
      await store.dispatch(ActionType.CREATE_TASK, taskData);
    }
    closeModal();
  } catch (error) {
    console.error('Failed to save task:', error);
  } finally {
    modalLoading.value = false;
  }
};

const closeModal = (): void => {
  showCreateModal.value = false;
  showEditModal.value = false;
  currentTask.value = null;
  modalLoading.value = false;
};
</script>

<style scoped>
.dashboard {
  @apply min-h-screen bg-gray-50;
}

.dashboard-header {
  @apply bg-white shadow-sm border-b border-gray-200;
}

.header-content {
  @apply max-w-7xl mx-auto px-4 py-6 flex justify-between items-center;
}

.header-left {
  @apply flex-1;
}

.dashboard-title {
  @apply text-2xl font-bold text-gray-900;
}

.dashboard-subtitle {
  @apply text-gray-600 mt-1;
}

.header-right {
  @apply flex items-center gap-4;
}

.stats-section {
  @apply max-w-7xl mx-auto px-4 py-6;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.stat-card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6 
         flex items-center gap-4;
}

.stat-icon {
  @apply p-3 rounded-lg;
}

.stat-content {
  @apply flex-1;
}

.stat-number {
  @apply text-2xl font-bold text-gray-900;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.controls-section {
  @apply max-w-7xl mx-auto px-4 pb-6;
}

.controls-content {
  @apply flex flex-col md:flex-row md:justify-between md:items-center gap-4;
}

.controls-left {
  @apply flex items-center gap-4;
}

.view-toggle {
  @apply flex bg-gray-100 rounded-lg p-1;
}

.toggle-btn {
  @apply px-3 py-1 text-sm font-medium rounded-md transition-colors;
}

.toggle-btn.active {
  @apply bg-white text-gray-900 shadow-sm;
}

.toggle-btn:not(.active) {
  @apply text-gray-500 hover:text-gray-700;
}

.controls-right {
  @apply flex items-center gap-4;
}

.filters {
  @apply flex gap-3;
}

.filter-select {
  @apply px-3 py-2 border border-gray-300 rounded-md text-sm
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.main-content {
  @apply max-w-7xl mx-auto px-4 pb-8;
}

.loading-state {
  @apply flex flex-col items-center justify-center py-12;
}

.loading-spinner-large {
  @apply w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4;
}

.list-view {
  @apply space-y-4;
}

.empty-state {
  @apply text-center py-12;
}

.task-list {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.list-task-card {
  @apply w-full;
}

.notification {
  @apply fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg 
         flex items-center gap-2 z-50 max-w-sm;
}

.notification.success {
  @apply bg-green-100 text-green-800 border border-green-200;
}

.notification.error {
  @apply bg-red-100 text-red-800 border border-red-200;
}
</style>