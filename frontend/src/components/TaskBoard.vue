<template>
  <div class="task-board">
    <div class="board-header">
      <h2>Task Board</h2>
      <div class="board-stats">
        <span class="stat">{{ taskStats.total }} Total</span>
        <span class="stat">{{ taskStats.todo }} To Do</span>
        <span class="stat">{{ taskStats.inProgress }} In Progress</span>
        <span class="stat">{{ taskStats.completed }} Completed</span>
      </div>
    </div>

    <div class="kanban-board">
      <div
        v-for="status in statuses"
        :key="status.value"
        class="status-column"
        :class="`status-${status.value}`"
      >
        <div class="column-header">
          <h3>{{ status.label }}</h3>
          <span class="task-count">{{
            getTasksByStatus(status.value).length
          }}</span>
        </div>

        <draggable
          v-model="taskColumns[status.value]"
          :group="{ name: 'tasks', pull: true, put: true }"
          :animation="200"
          ghost-class="ghost-task"
          chosen-class="chosen-task"
          drag-class="drag-task"
          @start="onDragStart"
          @end="onDragEnd"
          @change="onTaskMove"
          class="task-list"
          item-key="_id"
        >
          <template #item="{ element: task, index }">
            <TaskCard
              :key="task._id"
              :task="task"
              :index="index"
              @edit="$emit('edit-task', task)"
              @delete="$emit('delete-task', task._id)"
              @click="$emit('view-task', task)"
              class="draggable-task"
            />
          </template>
        </draggable>

        <button @click="$emit('add-task', status.value)" class="add-task-btn">
          <PlusIcon class="w-4 h-4" />
          Add Task
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useStore } from "vuex";
import draggable from "vue-draggable-next";
import { PlusIcon } from "@heroicons/vue/24/outline";
import TaskCard from "./TaskCard.vue";
import { Task, TaskStatus, DragDropResult } from "@shared/types";
import { ActionType } from "@/store";

// Props & Emits
interface Props {
  tasks: Task[];
}

interface Emits {
  (e: "edit-task", task: Task): void;
  (e: "delete-task", taskId: string): void;
  (e: "view-task", task: Task): void;
  (e: "add-task", status: TaskStatus): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Store
const store = useStore();
const taskStats = computed(() => store.getters.taskStats);

// Status configuration
const statuses = [
  { value: "todo" as TaskStatus, label: "To Do", color: "blue" },
  { value: "in-progress" as TaskStatus, label: "In Progress", color: "yellow" },
  { value: "completed" as TaskStatus, label: "Completed", color: "green" },
];

// Task columns for drag & drop
const taskColumns = reactive<Record<TaskStatus, Task[]>>({
  todo: [],
  "in-progress": [],
  completed: [],
});

// Getters
const getTasksByStatus = (status: TaskStatus) => {
  return store.getters.tasksByStatus(status);
};

// Watch for task changes and update columns
watch(
  () => props.tasks,
  (newTasks) => {
    // Clear columns
    statuses.forEach((status) => {
      taskColumns[status.value] = [];
    });

    // Populate columns
    newTasks.forEach((task) => {
      taskColumns[task.status].push(task);
    });

    // Sort by position
    Object.keys(taskColumns).forEach((status) => {
      taskColumns[status as TaskStatus].sort((a, b) => a.position - b.position);
    });
  },
  { immediate: true, deep: true }
);

// Drag & Drop handlers
let draggedTask: Task | null = null;
let draggedFromStatus: TaskStatus | null = null;
let draggedFromIndex: number = -1;

const onDragStart = (evt: any) => {
  const taskId = evt.item.getAttribute("data-task-id");
  draggedTask = props.tasks.find((task) => task._id === taskId) || null;

  // Find the source status and index
  for (const [status, tasks] of Object.entries(taskColumns)) {
    const index = tasks.findIndex((task) => task._id === taskId);
    if (index !== -1) {
      draggedFromStatus = status as TaskStatus;
      draggedFromIndex = index;
      break;
    }
  }
};

const onDragEnd = async (evt: any) => {
  if (!draggedTask || draggedFromStatus === null || draggedFromIndex === -1) {
    return;
  }

  const toElement = evt.to;
  const newIndex = evt.newIndex;
  const newStatus = toElement.getAttribute("data-status") as TaskStatus;

  // If position or status changed, update on server
  if (newStatus !== draggedFromStatus || newIndex !== draggedFromIndex) {
    const dragResult: DragDropResult = {
      from: {
        status: draggedFromStatus,
        index: draggedFromIndex,
      },
      to: {
        status: newStatus,
        index: newIndex,
      },
      task: draggedTask,
    };

    try {
      await store.dispatch(ActionType.REORDER_TASKS, dragResult);
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
    }
  }

  // Reset drag state
  draggedTask = null;
  draggedFromStatus = null;
  draggedFromIndex = -1;
};

const onTaskMove = (evt: any) => {
  // Handle optimistic updates if needed
  if (evt.added || evt.moved) {
    // The draggable component handles the local state update
    // We'll handle server sync in onDragEnd
  }
};
</script>

<style scoped>
.task-board {
  @apply p-6 bg-gray-50 min-h-screen;
}

.board-header {
  @apply flex justify-between items-center mb-6;
}

.board-header h2 {
  @apply text-2xl font-bold text-gray-900;
}

.board-stats {
  @apply flex gap-4;
}

.stat {
  @apply px-3 py-1 bg-white rounded-lg text-sm font-medium text-gray-700 shadow-sm;
}

.kanban-board {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.status-column {
  @apply bg-white rounded-lg shadow-sm p-4 min-h-96;
}

.status-todo {
  @apply border-t-4 border-blue-500;
}

.status-in-progress {
  @apply border-t-4 border-yellow-500;
}

.status-completed {
  @apply border-t-4 border-green-500;
}

.column-header {
  @apply flex justify-between items-center mb-4 pb-2 border-b border-gray-200;
}

.column-header h3 {
  @apply font-semibold text-gray-900;
}

.task-count {
  @apply bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium;
}

.task-list {
  @apply space-y-3 min-h-64;
}

.draggable-task {
  @apply cursor-move transition-transform hover:scale-105;
}

.ghost-task {
  @apply opacity-50 transform rotate-2;
}

.chosen-task {
  @apply transform scale-105 shadow-lg;
}

.drag-task {
  @apply transform rotate-2 shadow-lg;
}

.add-task-btn {
  @apply w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg 
         text-gray-500 hover:text-gray-700 hover:border-gray-400 
         transition-colors flex items-center justify-center gap-2
         hover:bg-gray-50;
}

.add-task-btn:hover {
  @apply text-blue-600 border-blue-300;
}
</style>
