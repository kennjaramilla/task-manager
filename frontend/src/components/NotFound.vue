<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1 class="not-found-title">404</h1>
      <h2 class="not-found-subtitle">Page Not Found</h2>
      <p class="not-found-text">
        The page you're looking for doesn't exist.
      </p>
      <router-link to="/dashboard" class="btn btn-primary">
        Go to Dashboard
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  @apply min-h-screen flex items-center justify-center bg-gray-50;
}

.not-found-content {
  @apply text-center;
}

.not-found-title {
  @apply text-6xl font-bold text-gray-900 mb-4;
}

.not-found-subtitle {
  @apply text-2xl font-semibold text-gray-700 mb-4;
}

.not-found-text {
  @apply text-gray-600 mb-8;
}
</style>