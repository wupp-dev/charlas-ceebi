<template>
  <div class="min-h-screen flex flex-col">
    <header>
      <TopNav/>
    </header>
    <section class="flex flex-grow">
      <div class="flex flex-col items-center md:justify-center max-w-screen-md mx-auto">
        <div class="flex my-10">
          <form @submit.prevent="search" class="flex items-center">
            <input
              v-model="searchTerm"
              type="text"
              class="border border-gray-300 rounded-l px-4 py-2 w-64 md:w-96 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Correo o NIF"
            />
            <button
              type="submit"
              class="bg-blue-500 hover:bg-blue-600 text-white rounded-r px-4 py-2 md:w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Buscar
            </button>
          </form>
        </div>
        <div class="flex">
          <div v-if="loading" class=" text-gray-500">Buscando...</div>
          <div v-else-if="error" class=" text-red-500">{{ error }}</div>
          <div v-else-if="searched && !results.id" class=" text-gray-500">No se ha encontrado ningún resultado.</div>
          <div v-else-if="results.id">
            <table class="table-auto border-collapse border border-gray-500 rounded p-4 mb-4 text-center">
              <tr class="hover:bg-gray-100">
                <th class="border border-gray-500 p-2 md:w-[140px]">Turno 1</th>
                <td class="border border-gray-500 p-2 md:w-[450px]">{{ results.t1 }}</td>
              </tr>
              <tr class="hover:bg-gray-100">
                <th class="border border-gray-500 p-2">Turno 2</th>
                <td class="border border-gray-500 p-2">{{ results.t2 }}</td>
              </tr>
              <tr class="hover:bg-gray-100">
                <th class="border border-gray-500 p-2">Turno 3</th>
                <td class="border border-gray-500 p-2">{{ results.t3 }}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </section>
    <footer>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TopNav from '@/components/TopNav.vue'

interface SearchResult {
  id: string | null;
  t1: string | null;
  t2: string | null;
  t3: string | null;
}

const searched = ref(false)
const searchTerm = ref('')
const results = ref<SearchResult>({
  id: null,
  t1: null,
  t2: null,
  t3: null,
});
const loading = ref(false)
const error = ref('')

async function search() {
  loading.value = true
  searched.value = true
  if (!searchTerm.value) {
    results.value.id = null
    loading.value = false
    return
  }

  error.value = ''

  try {
    const response = await fetch(`https://ceebi.wupp.dev/api/ceebi-ii/consulta/?id=${searchTerm.value}`)
    if (response.status === 404) {
      results.value.id = null
    } else {
      const data = await response.json()
      results.value = data.output;
    }
  } catch (e) {
    console.log(e)
    error.value = 'Ha ocurrido un error en la búsqueda.'
  } finally {
    loading.value = false
  }
}
</script>