import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TaskCard from '@/components/TaskCard.vue';
import { Task } from '@shared/types';

const mockTask: Task = {
  _id: '1',
  title: 'Test Task',
  description: 'Test Description',
  priority: 'high',
  status: 'todo',
  user: 'user1',
  position: 0,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

describe('TaskCard', () => {
  it('renders task information correctly', () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask }
    });

    expect(wrapper.text()).toContain('Test Task');
    expect(wrapper.text()).toContain('Test Description');
    expect(wrapper.text()).toContain('HIGH');
  });

  it('emits edit event when edit button is clicked', async () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask }
    });

    await wrapper.find('.edit-btn').trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
  });

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask }
    });

    await wrapper.find('.delete-btn').trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });

  it('shows overdue styling for overdue tasks', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: '2022-01-01T00:00:00Z' // Past date
    };

    const wrapper = mount(TaskCard, {
      props: { task: overdueTask }
    });

    expect(wrapper.find('.due-date').classes()).toContain('overdue');
  });

  it('applies correct priority styling', () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask }
    });

    expect(wrapper.find('.task-card').classes()).toContain('priority-high');
    expect(wrapper.find('.priority-indicator').classes()).toContain('priority-high');
  });
});