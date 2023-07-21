<template>
  <nav class="border-b bg-white">
    <div class="flex flex-col md:flex-row items-center justify-between w-full px-6 mx-auto">
      <div class="flex-1 items-center flex-grow">
        <div class="w-fit max-w-[200px] mx-5 pt-2 pb-2">
          <img src="../assets/images/logo-ceebi-horizontal.png" alt="CEEBI" class="min-w-[200px] max-h-fit">
        </div>
      </div>
      <div class="flex-2 items-center justify-center flex-grow mt-2 mb-2">
        <h1 class="text-2xl font-bold text-center">{{ title }}</h1>
      </div>
      <div class="flex-1 items-center flex-grow">
        <div></div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
defineProps({
  title: String,
})
</script>