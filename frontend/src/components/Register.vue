<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">Create account</h1>
        <p class="auth-subtitle">Sign up to get started</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="name" class="form-label">Full Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="form-input"
            :class="{ 'error': errors.name }"
            placeholder="Enter your full name"
            required
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            :class="{ 'error': errors.email }"
            placeholder="Enter your email"
            required
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            :class="{ 'error': errors.password }"
            placeholder="Create a password (min. 6 characters)"
            required
          />
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="form-input"
            :class="{ 'error': errors.confirmPassword }"
            placeholder="Confirm your password"
            required
          />
          <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
        </div>

        <button 
          type="submit" 
          class="auth-submit-btn"
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <div class="auth-footer">
        <p class="auth-switch">
          Already have an account?
          <router-link to="/login" class="auth-link">Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { RegisterRequest } from '@shared/types';
import { ActionType } from '@/store';

// Composables
const store = useStore();
const router = useRouter();

// State
const form = reactive<RegisterRequest>({
  name: '',
  email: '',
  password: ''
});

const confirmPassword = ref('');

const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

// Computed
const loading = computed(() => store.state.authLoading);
const isFormValid = computed(() => {
  return form.name.trim().length > 0 && 
         form.email.includes('@') && 
         form.password.length >= 6 &&
         form.password === confirmPassword.value;
});

// Methods
const validateForm = (): boolean => {
  errors.name = '';
  errors.email = '';
  errors.password = '';
  errors.confirmPassword = '';
  
  if (!form.name.trim()) {
    errors.name = 'Name is required';
    return false;
  }
  
  if (!form.email.includes('@')) {
    errors.email = 'Please enter a valid email address';
    return false;
  }
  
  if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
    return false;
  }
  
  if (form.password !== confirmPassword.value) {
    errors.confirmPassword = 'Passwords do not match';
    return false;
  }
  
  return true;
};

const handleRegister = async (): Promise<void> => {
  if (!validateForm()) return;
  
  try {
    await store.dispatch(ActionType.REGISTER, form);
    router.push('/dashboard');
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
</script>

<style scoped>
/* Same styles as Login.vue */
.auth-container {
  @apply min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4;
}

.auth-card {
  @apply max-w-md w-full bg-white rounded-lg shadow-md p-8;
}

.auth-header {
  @apply text-center mb-8;
}

.auth-title {
  @apply text-2xl font-bold text-gray-900 mb-2;
}

.auth-subtitle {
  @apply text-gray-600;
}

.auth-form {
  @apply space-y-6;
}

.form-group {
  @apply space-y-2;
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

.auth-submit-btn {
  @apply w-full flex justify-center items-center px-4 py-2 border border-transparent 
         rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 
         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
         focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors;
}

.loading-spinner {
  @apply inline-block w-4 h-4 border-2 border-white border-t-transparent 
         rounded-full animate-spin mr-2;
}

.auth-footer {
  @apply mt-6 text-center;
}

.auth-switch {
  @apply text-sm text-gray-600;
}

.auth-link {
  @apply font-medium text-blue-600 hover:text-blue-500 transition-colors;
}
</style>