<template>
  <div class="flex flex-col items-center justify-center h-screen max-w-screen-md mx-auto">
    <div class="flex items-center">
      <input
        v-model="searchTerm"
        type="text"
        class="border border-gray-300 rounded-l px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Correo o NIF"
      />
      <button
        @click="search"
        class="bg-blue-500 hover:bg-blue-600 text-white rounded-r px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Buscar
      </button>
    </div>
    <div v-if="loading" class="mt-4 text-gray-500">Buscando...</div>
    <div v-else-if="error" class="mt-4 text-red-500">{{ error }}</div>
    <div v-else-if="searched && results.length === 0" class="mt-4 text-gray-500">No se ha encontrado ningún resultado.</div>
    <div v-else class="mt-4">
      <div v-for="result in results" :key="result.id" class="border border-gray-500 rounded p-4 mb-4 text-center">
        <h2 class="text-lg font-medium mb-2 hover:bg-gray-200">{{ result.t1 }}</h2>
        <h2 class="text-lg font-medium mb-2 hover:bg-gray-200">{{ result.t2 }}</h2>
        <h2 class="text-lg font-medium mb-2 hover:bg-gray-200">{{ result.t3 }}</h2>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface SearchResult {
  id: number;
  t1: string;
  t2: string;
  t3: string;
}

const searched = ref(false)
const searchTerm = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')

async function search() {
  loading.value = true
  searched.value = true
  if (!searchTerm.value) {
    results.value = []
    loading.value = false
    return
  }

  error.value = ''

  try {
    const response = await fetch(`https://ceebi.wupp.dev/api/?key=${searchTerm.value}`)
    if (response.status === 404) {
      results.value = []
    } else {
      const data = await response.json()
      results.value = data;
    }
  } catch (e) {
    console.log(e)
    error.value = 'Ha ocurrido un error en la búsqueda.'
  } finally {
    loading.value = false
  }
}
</script>