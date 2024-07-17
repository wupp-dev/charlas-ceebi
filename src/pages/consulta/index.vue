<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <header>
      <TopNav :title="'Consulta de talleres y microcharlas'" />
    </header>
    <main v-auto-animate class="flex flex-col flex-grow items-center md:justify-center">
      <div v-if="!available">
        <a-alert
          message="Apartado aun no disponible."
          type="warning"
          style="font-size: 1.125rem"
          class="m-8"
          show-icon
        />
      </div>
      <div v-else class="max-md:mt-10 w-6/12 max-w-[35rem] min-w-[20rem]">
        <a-spin :spinning="loading">
          <a-input-search
            v-model:value="query"
            placeholder="DNI/NIE"
            size="large"
            class="w-full"
            :status="error ? 'error' : ''"
            :disabled="loading"
            @search="onSubmit"
          >
            <template #enterButton>
              <a-button type="primary">Buscar</a-button>
            </template>
          </a-input-search></a-spin
        >
      </div>
      <div v-if="available && searched && !loading && !error" class="m-4">
        <div v-if="results.id">
          <a-table :dataSource="dataSource" :columns="columns" :pagination="false" />
        </div>
        <p v-else>No se han encontrado resultados.</p>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { tryit } from 'radash'
import { useRoute, useRouter } from 'vue-router'
import { useEditionStore } from '@/stores/edition'

type SearchResult = {
  id: string | null
  t1: string
  t2: string
  t3: string
}

const available = ref(true)
const editionStore = useEditionStore()
const route = useRoute()
const router = useRouter()
const query = ref('')
const loading = ref(false)
const searched = ref(false)
const results = ref<SearchResult>({
  id: null,
  t1: '',
  t2: '',
  t3: ''
})
const error = ref(false)
const columns = ref([
  {
    title: 'Turno',
    dataIndex: 'turno',
    key: 'turno',
    width: '5rem'
  },
  {
    title: 'Taller o microcharla',
    dataIndex: 'event',
    key: 'event'
  }
])
const dataSource = computed(() => {
  if (results.value.id) {
    return [
      {
        key: '1',
        turno: 'Turno 1',
        event: results.value.t1
      },
      {
        key: '2',
        turno: 'Turno 2',
        event: results.value.t2
      },
      {
        key: '3',
        turno: 'Turno 3',
        event: results.value.t3
      }
    ]
  } else {
    return []
  }
})

editionStore.$subscribe(() => reset())

const reset = (alsoQuery = true) => {
  if (loading.value) {
    return
  }
  error.value = false
  results.value = {
    id: null,
    t1: '',
    t2: '',
    t3: ''
  }
  searched.value = false
  if (alsoQuery) {
    query.value = ''
  }
}

async function onSubmit() {
  reset(false)
  loading.value = true

  if (!query.value) {
    loading.value = false
    return
  }

  const [err, res] = await tryit(fetch)(
    `${import.meta.env.VITE_API_URL}/${editionStore.selected}/consulta/turnos?id=${query.value}`
  )
  if (err) {
    error.value = true
    message.error('No se ha podido conectar con el servidor.')
  } else {
    if (res.status === 200) {
      const data = await res.json()
      results.value = data.output
      message.success('Resultado encontrado.')
    } else if (res.status === 404) {
      message.warning('No se han encontrado resultados.')
    } else {
      error.value = true
      message.error('Respuesta inesperada del servidor.')
    }
  }
  loading.value = false
  searched.value = true
}

onMounted(() => {
  const id = route.query.id
  if (id) {
    query.value = id as string
    onSubmit()
    router.push({ query: {} })
  }
})
</script>
