<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <header>
      <TopNav :title="'Descarga de certificados de asistencia'" />
    </header>
    <main class="flex flex-col flex-grow items-center md:justify-center">
      <div v-if="!results.id">
        <a-spin v-auto-animate :spinning="loading">
          <a-card
            v-auto-animate
            class="m-8 max-w-[30rem]"
            title="Introduce tus datos"
            :bordered="false"
            :headStyle="{ 'font-size': '1.35rem', 'text-align': 'center' }"
          >
            <a-form
              class="w-fit mx-auto"
              :model="formState"
              :layout="'vertical'"
              :label-col="{ span: 32 }"
              :wrapper-col="{ span: 32 }"
              autocomplete="off"
              @finish="onSubmit"
              @finishFailed="onFinishFailed"
            >
              <a-form-item
                label="Documento identificativo (DNI o similar)"
                name="nif"
                :rules="[{ required: true, message: 'Introduce tu número de identificación.' }]"
              >
                <a-input
                  v-model:value="formState.nif"
                  placeholder="X00000000X"
                  v-maska
                  data-maska="Z"
                  data-maska-tokens="Z:[a-z0-9A-Z]:multiple"
                />
              </a-form-item>

              <a-form-item
                label="Correo electrónico"
                name="email"
                :rules="[{ required: true, message: 'Introduce tu correo electrónico' }]"
              >
                <a-input
                  v-model:value="formState.email"
                  placeholder="ejemplo@correo.es"
                  v-maska
                  data-maska="Z"
                  data-maska-tokens="Z:[^\s]:multiple"
                />
              </a-form-item>
              <a-form-item :wrapper-col="{ span: 32 }">
                <a-button class="mx-auto" type="primary" html-type="submit"
                  >Comprobar certificados disponibles</a-button
                >
              </a-form-item>
            </a-form>
            <a-alert
              v-if="error.busqueda"
              :message="error.busqueda"
              :type="notFound ? 'warning' : 'error'"
              show-icon
            /> </a-card
        ></a-spin>
      </div>
      <div v-else>a</div>
    </main>
    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { vMaska } from 'maska/vue'
import { tryit } from 'radash'
import { message } from 'ant-design-vue'
import { useEditionStore } from '@/stores/edition'

interface FormState {
  nif: string
  email: string
}

type SearchResult = {
  id: string | null
  asistencia: number
  microcursos: {
    doble: boolean
    micro1: string
    micro2: string
  }
  poster: boolean
}

const results = ref<SearchResult>({
  id: null,
  asistencia: 0,
  microcursos: {
    doble: false,
    micro1: '',
    micro2: ''
  },
  poster: false
})

const editionStore = useEditionStore()
const loading = ref(false)
const notFound = ref(false)

const formState = reactive<FormState>({
  nif: '',
  email: ''
})

const error = ref({
  busqueda: '',
  asistencia: '',
  microcursos: '',
  poster: ''
})

async function onSubmit() {
  loading.value = true
  notFound.value = false
  results.value = {
    id: null,
    asistencia: 0,
    microcursos: {
      doble: false,
      micro1: '',
      micro2: ''
    },
    poster: false
  }
  error.value = {
    busqueda: '',
    asistencia: '',
    microcursos: '',
    poster: ''
  }
  const [err, res] = await tryit(fetch)(
    `${import.meta.env.VITE_API_URL}/${editionStore.selected}/consulta/certificado?nif=${formState.nif.trim()}&email=${formState.email.trim()}`
  )
  if (err) {
    error.value.busqueda =
      'No se ha podido conectar con el servidor. Conctacta con nosotros por correo info@biociencias.es'
    message.error('No se ha podido conectar con el servidor.')
  } else {
    if (res.status === 200) {
      results.value = await res.json()
      message.success('Usuario encontrado.')
    } else if (res.status === 404) {
      notFound.value = true
      error.value.busqueda =
        'No se ha encontrado ningún usuario para el NIF y correo electrónico proporcionados. Si crees que es un error, conctacta con nosotros por correo info@biociencias.es'
      message.warning('No se ha encontrado ningún usuario.')
    } else {
      error.value.busqueda =
        'Respuesta inesperada del servidor. Conctacta con nosotros por correo info@biociencias.es'
      message.error('Respuesta inesperada del servidor.')
    }
  }
  loading.value = false
}

function onFinishFailed() {
  notFound.value = false
  results.value = {
    id: null,
    asistencia: 0,
    microcursos: {
      doble: false,
      micro1: '',
      micro2: ''
    },
    poster: false
  }
  error.value = {
    busqueda: '',
    asistencia: '',
    microcursos: '',
    poster: ''
  }
}
</script>
