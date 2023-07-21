<template>
  <nav class="border-b bg-white">
    <div class="flex flex-col md:flex-row items-center justify-between w-full px-4 mx-auto">
      <div class="flex-1 items-center flex-grow">
        <div class="w-fit max-w-[200px] mx-5 pt-2 pb-2">
          <img src="../assets/images/logo-ceebi-horizontal.png" alt="CEEBI" class="min-w-[200px] max-h-fit">
        </div>
      </div>
      <div class="flex-2 items-center justify-center flex-grow my-2">
        <h1 class="text-2xl font-bold text-center">{{ title }}</h1>
      </div>
      <div class="flex-1 items-center flex-grow">
        <div class="flex justify-end">
          <router-link to="/consulta" class="mx-2 my-2 text-lg font-bold focus:outline-none hover:text-blue-500" :class="{ 'text-blue-500': $route.path === '/consulta' }">Consulta</router-link>
          <router-link to="/certificado" class="mx-2 my-2 text-lg font-bold focus:outline-none hover:text-blue-500" :class="{ 'text-blue-500': $route.path === '/certificado' }">Certificado</router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps({
  title: String,
})
</script>