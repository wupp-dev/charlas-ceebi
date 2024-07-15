<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#34B6ED'
      }
    }"
  >
  </a-config-provider>
  <RouterView />
</template>
