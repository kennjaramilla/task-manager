<template>
  <div 
    :data-task-id="task._id"
    class="task-card"
    :class="[
      `priority-${task.priority}`,
      `status-${task.status}`,
      { 'overdue': isOverdue }
    ]"
  >
    <div class="task-header">
      <div class="task-priority">
        <span 
          class="priority-indicator"
          :class="`priority-${task.priority}`"
        ></span>
        <span class="priority-text">{{ task.priority.toUpperCase() }}</span>
      </div>
      
      <div class="task-actions">
        <button 
          @click.stop="$emit('edit')"
          class="action-btn edit-btn"
          title="Edit task"
        >
          <PencilIcon class="w-4 h-4" />
        </button>
        <button 
          @click.stop="$emit('delete')"
          class="action-btn delete-btn"
          title="Delete task"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="task-content">
      <h4 class="task-title">{{ task.title }}</h4>
      <p v-if="task.description" class="task-description">
        {{ task.description }}
      </p>
    </div>

    <div class="task-footer">
      <div class="task-meta">
        <span v-if="task.dueDate" class="due-date" :class="{ 'overdue': isOverdue }">
          <CalendarIcon class="w-4 h-4" />
          {{ formatDate(task.dueDate) }}
        </span>
        <span class="created-date">
          <ClockIcon class="w-4 h-4" />
          {{ formatRelativeTime(task.createdAt) }}
        </span>
      </div>
      
      <div class="task-status">
        <span 
          class="status-badge"
          :class="`status-${task.status}`"
        >
          {{ formatStatus(task.status) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon, 
  ClockIcon 
} from '@heroicons/vue/24/outline';
import { Task } from '@shared/types';

// Props & Emits
interface Props {
  task: Task;
  index?: number;
}

interface Emits {
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'click'): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

// Computed properties
const isOverdue = computed(() => {
  if (!props.task.dueDate) return false;
  return new Date(props.task.dueDate) < new Date() && props.task.status !== 'completed';
});

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  return formatDate(dateString);
};

const formatStatus = (status: string): string => {
  return status.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};
</script>

<style scoped>
.task-card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4 
         hover:shadow-md transition-all duration-200 cursor-pointer
         hover:border-gray-300;
}

.task-card.priority-high {
  @apply border-l-4 border-l-red-500;
}

.task-card.priority-medium {
  @apply border-l-4 border-l-yellow-500;
}

.task-card.priority-low {
  @apply border-l-4 border-l-green-500;
}

.task-card.overdue {
  @apply bg-red-50 border-red-200;
}

.task-header {
  @apply flex justify-between items-start mb-3;
}

.task-priority {
  @apply flex items-center gap-2;
}

.priority-indicator {
  @apply w-2 h-2 rounded-full;
}

.priority-indicator.priority-high {
  @apply bg-red-500;
}

.priority-indicator.priority-medium {
  @apply bg-yellow-500;
}

.priority-indicator.priority-low {
  @apply bg-green-500;
}

.priority-text {
  @apply text-xs font-medium text-gray-600 uppercase tracking-wide;
}

.task-actions {
  @apply flex gap-1;
}

.action-btn {
  @apply p-1 text-gray-400 hover:text-gray-600 transition-colors rounded;
}

.edit-btn:hover {
  @apply text-blue-600;
}

.delete-btn:hover {
  @apply text-red-600;
}

.task-content {
  @apply mb-4;
}

.task-title {
  @apply font-semibold text-gray-900 mb-2 line-clamp-2;
}

.task-description {
  @apply text-sm text-gray-600 line-clamp-3;
}

.task-footer {
  @apply flex justify-between items-end;
}

.task-meta {
  @apply space-y-1;
}

.due-date, .created-date {
  @apply flex items-center gap-1 text-xs text-gray-500;
}

.due-date.overdue {
  @apply text-red-600 font-medium;
}

.task-status {
  @apply flex items-end;
}

.status-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.status-badge.status-todo {
  @apply bg-blue-100 text-blue-800;
}

.status-badge.status-in-progress {
  @apply bg-yellow-100 text-yellow-800;
}

.status-badge.status-completed {
  @apply bg-green-100 text-green-800;
}

/* Utility classes */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>