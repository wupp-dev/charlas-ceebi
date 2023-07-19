<template>
  <div class="border-b border-gray-300">
    <div class="flex items-center justify-between max-w-screen-xl mx-auto px-4 py-2">
      <div class="flex items-center">
        <img src="/logo.png" alt="Logo" class="h-8 mr-4">
        <h1 class="text-lg font-medium">My App</h1>
      </div>
      <button
        @click="console.log('Upload clicked')"
        class="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Upload
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">


</script>