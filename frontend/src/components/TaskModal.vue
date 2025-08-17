<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          {{ isEdit ? 'Edit Task' : 'Create New Task' }}
        </h3>
        <button @click="$emit('close')" class="close-btn">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="title" class="form-label">Title *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            class="form-input"
            :class="{ 'error': errors.title }"
            placeholder="Enter task title"
            required
          />
          <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            class="form-input"
            rows="3"
            placeholder="Enter task description (optional)"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="priority" class="form-label">Priority</label>
            <select id="priority" v-model="form.priority" class="form-input">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div class="form-group">
            <label for="status" class="form-label">Status</label>
            <select id="status" v-model="form.status" class="form-input">
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="dueDate" class="form-label">Due Date</label>
          <input
            id="dueDate"
            v-model="form.dueDate"
            type="datetime-local"
            class="form-input"
            :min="minDate"
          />
        </div>

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="loading || !isFormValid"
          >
            <span v-if="loading" class="loading-spinner"></span>
            {{ loading ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { Task, CreateTaskRequest, TaskPriority, TaskStatus } from '@shared/types';

// Props & Emits
interface Props {
  task?: Task | null;
  isEdit?: boolean;
  loading?: boolean;
}

interface Emits {
  (e: 'save', data: CreateTaskRequest): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  task: null,
  isEdit: false,
  loading: false
});

const emit = defineEmits<Emits>();

// Form state
const form = reactive({
  title: '',
  description: '',
  priority: 'medium' as TaskPriority,
  status: 'todo' as TaskStatus,
  dueDate: ''
});

// Validation
const errors = reactive({
  title: ''
});

// Computed properties
const minDate = computed(() => {
  const now = new Date();
  return now.toISOString().slice(0, 16); // Format for datetime-local input
});

const isFormValid = computed(() => {
  return form.title.trim().length > 0 && form.title.trim().length <= 100;
});

// Watch for task prop changes (when editing)
watch(
  () => props.task,
  (newTask) => {
    if (newTask && props.isEdit) {
      form.title = newTask.title;
      form.description = newTask.description || '';
      form.priority = newTask.priority;
      form.status = newTask.status;
      form.dueDate = newTask.dueDate ? 
        new Date(newTask.dueDate).toISOString().slice(0, 16) : '';
    }
  },
  { immediate: true }
);

// Methods
const validateForm = (): boolean => {
  errors.title = '';
  
  if (!form.title.trim()) {
    errors.title = 'Title is required';
    return false;
  }
  
  if (form.title.trim().length > 100) {
    errors.title = 'Title must be 100 characters or less';
    return false;
  }
  
  return true;
};

const handleSubmit = (): void => {
  if (!validateForm()) return;
  
  const taskData: CreateTaskRequest = {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    priority: form.priority,
    status: form.status,
    dueDate: form.dueDate || undefined
  };
  
  emit('save', taskData);
};

const handleOverlayClick = (): void => {
  emit('close');
};

// Reset form when modal closes
const resetForm = (): void => {
  form.title = '';
  form.description = '';
  form.priority = 'medium';
  form.status = 'todo';
  form.dueDate = '';
  errors.title = '';
};

// Expose reset method for parent component
defineExpose({ resetForm });
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-md w-full max-h-90vh overflow-auto;
}

.modal-header {
  @apply flex justify-between items-center p-6 border-b border-gray-200;
}

.modal-title {
  @apply text-lg font-semibold text-gray-900;
}

.close-btn {
  @apply text-gray-400 hover:text-gray-600 transition-colors;
}

.modal-body {
  @apply p-6 space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-row {
  @apply grid grid-cols-2 gap-4;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         transition-colors;
}

.form-input.error {
  @apply border-red-300 focus:ring-red-500 focus:border-red-500;
}

.error-message {
  @apply text-sm text-red-600;
}

.modal-footer {
  @apply flex justify-end gap-3 pt-4 border-t border-gray-200;
}

.loading-spinner {
  @apply inline-block w-4 h-4 border-2 border-white border-t-transparent 
         rounded-full animate-spin mr-2;
}
</style>