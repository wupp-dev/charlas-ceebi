<template>
  <div v-auto-animate class="min-h-screen flex flex-col bg-gray-100">
    <header>
      <TopNav :title="'Descarga de certificados de asistencia'" />
    </header>
    <div v-if="error" class="m-4 max-w-[80%] mx-auto">
      <a-alert :message="error" :type="notFound ? 'warning' : 'error'" show-icon />
    </div>
    <div v-if="available && results.id" class="m-4 max-w-[80%] mx-auto">
      <a-alert
        v-if="!downloadable"
        message="Los certificados aun no están disponibles para descargar."
        type="warning"
        show-icon
        closable
      />
      <a-alert
        v-else-if="notAvailableTxt"
        :message="notAvailableTxt"
        type="warning"
        show-icon
        closable
      />
      <a-alert
        v-else-if="typeof downloadable === 'object'"
        message="Algunos certificados aun no están disponibles para descargar."
        type="warning"
        show-icon
        closable
      />
    </div>
    <main class="flex flex-col flex-grow items-center md:justify-center">
      <div v-if="!available">
        <a-alert message="Apartado aun no disponible." type="warning" class="my-8" show-icon />
      </div>
      <div v-else-if="!results.id">
        <a-spin v-auto-animate :spinning="loading">
          <a-card
            v-auto-animate
            class="my-8 max-w-[30rem]"
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
              @finish="onSubmit"
              @finishFailed="reset"
            >
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
              <a-form-item name="remember" :wrapper-col="{ span: 32 }">
                <a-checkbox v-model:checked="formState.remember"
                  >Recordar correo electrónico</a-checkbox
                >
              </a-form-item>
              <a-form-item :wrapper-col="{ span: 32 }">
                <a-button class="mx-auto" type="primary" html-type="submit"
                  >Comprobar certificados disponibles</a-button
                >
              </a-form-item>
            </a-form>
          </a-card></a-spin
        >
      </div>
      <div v-else>
        <a-card
          v-auto-animate
          class="my-8 max-w-[30rem]"
          title="Certificados disponibles"
          :bordered="false"
          :headStyle="{
            'font-size': '1.35rem',
            'text-align': 'center'
          }"
          :tab-list="tabList"
          :active-tab-key="activeTab"
          @tabChange="(key: string) => onTabChange(key)"
        >
          <div v-if="loading" class="flex items-center justify-center">
            <a-spin tip="Cargando..." />
          </div>
          <div v-else-if="activeTab === 'asistencia'">
            <a-alert
              v-if="results.asistencia.percent < 80.0"
              message="No has alcanzado el porcentaje mínimo de asistencia"
              type="error"
              class="mb-6"
              show-icon
            />
            <a-alert
              v-else
              message="Has alcanzado el porcentaje mínimo de asistencia"
              type="success"
              class="mb-6"
              show-icon
            />
            <div class="w-fit mx-auto m-2">
              <a-progress
                type="circle"
                :percent="attendPercent"
                :stroke-color="{
                  '0%': '#34B6ED',
                  '100%': '#70C1B3'
                }"
                :format="(percent: number) => percent + '%'"
                ><template #format="percent">
                  <span>{{ percent }}</span>
                </template></a-progress
              >
            </div>

            <p class="font-bold text-center" v-if="hoursDone">
              Has asistido a {{ hoursDone }} horas de un total de 25 horas.
            </p>
            <p v-else class="text-center">No tienes asistencia presencial resgistrada.</p>

            <div v-if="results.asistencia.sessions.length > 0" class="mx-auto w-fit">
              <a-button
                class="flex flex-row items-center justify-center mt-4"
                shape="round"
                @click="modalVisible = true"
              >
                <template #icon>
                  <IconCalendarCheck class="h-4 w-4 m-1" />
                </template>
                Ver eventos asistidos
              </a-button>
              <a-modal
                v-model:open="modalVisible"
                title="Eventos a los que has asistido"
                centered
                footer=""
                @ok="modalVisible = false"
              >
                <div
                  v-for="session in results.asistencia.sessions"
                  :key="session.time"
                  class="flex flex-col"
                >
                  <div
                    v-for="(event, index) in session.events"
                    :key="event"
                    class="flex flex-row items-center my-2"
                  >
                    <span class="text-primary font-bold min-w-10 mr-2 text-start"
                      >{{ (session.eventHours || ['-', '-', '-'])[index] }}h</span
                    >
                    {{ event }}
                  </div>
                </div>
              </a-modal>
            </div>
            <div v-if="results.asistencia.percent >= 80.0" class="mx-auto w-fit">
              <a-button
                @click="download"
                :disabled="
                  !downloadable || (typeof downloadable === 'object' && !downloadable.asistencia)
                "
                shape="round"
                class="flex flex-row items-center justify-center mt-4"
              >
                <template #icon>
                  <IconDownload class="h-4 w-4 m-1" />
                </template>
                Descargar certificado
              </a-button>
            </div>
          </div>
          <div v-else-if="activeTab === 'microcurso'">
            <div v-if="!results.microcursos.doble && results.microcursos.micro1">
              <a-alert
                message="Has asistido a 1 microcurso de dos días."
                type="success"
                class="mb-6"
                show-icon
              />
              <div class="w-fit mx-auto m-2">
                <a-progress
                  type="circle"
                  :percent="microPercent"
                  :stroke-color="{
                    '0%': '#34B6ED',
                    '100%': '#70C1B3'
                  }"
                  :format="(percent: number) => Math.floor(percent / 100) + '/1'"
                  ><template #format="percent">
                    <span>{{ percent }}</span>
                  </template></a-progress
                >
              </div>
              <div class="w-fit mx-auto micro-btn mt-4">
                <a-button
                  @click="download(results.microcursos.micro1)"
                  :disabled="
                    !downloadable || (typeof downloadable === 'object' && !downloadable.microcursos)
                  "
                  ><div class="inline-flex items-center justify-center">
                    <IconDownload class="w-4 h-4 min-h-4 min-w-4 mr-2" />
                    {{ results.microcursos.micro1 }}
                  </div></a-button
                >
              </div>
            </div>
            <div
              v-else-if="
                results.microcursos.doble &&
                results.microcursos.micro1 &&
                results.microcursos.micro2
              "
            >
              <a-alert
                message="Has asistido a 2 microcursos de un día."
                type="success"
                class="mb-6"
                show-icon
              />
              <div class="w-fit mx-auto m-2">
                <a-progress
                  type="circle"
                  :percent="microPercent"
                  :stroke-color="{
                    '0%': '#34B6ED',
                    '100%': '#70C1B3'
                  }"
                  :format="(percent: number) => Math.floor(percent / 50) + '/2'"
                  ><template #format="percent">
                    <span>{{ percent }}</span>
                  </template></a-progress
                >
              </div>
              <div class="w-fit mx-auto micro-btn mt-4">
                <a-button
                  @click="download(results.microcursos.micro1)"
                  :disabled="
                    !downloadable || (typeof downloadable === 'object' && !downloadable.microcursos)
                  "
                  ><div class="inline-flex items-center justify-center">
                    <IconDownload class="w-4 h-4 min-h-4 min-w-4 mr-2" />
                    {{ results.microcursos.micro1 }}
                  </div></a-button
                >
              </div>
              <div class="w-fit mx-auto micro-btn mt-4">
                <a-button
                  @click="download(results.microcursos.micro2)"
                  :disabled="
                    !downloadable || (typeof downloadable === 'object' && !downloadable.microcursos)
                  "
                  ><div class="inline-flex items-center justify-center">
                    <IconDownload class="w-4 h-4 min-h-4 min-w-4 mr-2" />
                    {{ results.microcursos.micro2 }}
                  </div></a-button
                >
              </div>
            </div>
            <div v-else-if="results.microcursos.doble && results.microcursos.micro1">
              <a-alert
                message="Solo has asistido a 1 microcurso de un día."
                type="warning"
                class="mb-6"
                show-icon
              />
              <div class="w-fit mx-auto m-2">
                <a-progress
                  type="circle"
                  :percent="microPercent"
                  :stroke-color="{
                    '0%': '#34B6ED',
                    '100%': '#70C1B3'
                  }"
                  :format="(percent: number) => Math.floor(percent / 50) + '/2'"
                  ><template #format="percent">
                    <span>{{ percent }}</span>
                  </template></a-progress
                >
              </div>
              <div class="w-fit mx-auto micro-btn mt-4">
                <a-button
                  @click="download(results.microcursos.micro1)"
                  :disabled="
                    !downloadable || (typeof downloadable === 'object' && !downloadable.microcursos)
                  "
                  ><div class="inline-flex items-center justify-center">
                    <IconDownload class="w-4 h-4 min-h-4 min-w-4 mr-2" />
                    {{ results.microcursos.micro1 }}
                  </div></a-button
                >
              </div>
            </div>
            <div v-else>
              <a-alert message="No has asistido a ningún microcurso." type="error" show-icon />
            </div>
          </div>
          <div v-else="activeTab === 'poster'">
            <div v-if="!downloadable">
              <a-alert
                message="La información sobre quién ha presentado póster aun no está actualizada."
                type="warning"
                show-icon
              />
            </div>
            <div v-else-if="results.poster">
              <a-alert
                message="Has presentado al menos un póster."
                type="success"
                class="mb-6"
                show-icon
              />
              <p>
                Hayas presentado los pósteres que hayas presentado, se descargan todos juntos en
                formato ZIP.
              </p>
              <div class="mx-auto w-fit">
                <a-button
                  @click="download"
                  :disabled="
                    !downloadable || (typeof downloadable === 'object' && !downloadable.poster)
                  "
                  shape="round"
                  class="flex flex-row items-center justify-center mt-4"
                >
                  <template #icon>
                    <IconDownload class="h-4 w-4 m-1" />
                  </template>
                  Descargar certificados
                </a-button>
              </div>
            </div>
            <div v-else>
              <a-alert message="No has presentado ningún póster." type="error" show-icon />
            </div>
          </div>
          <template #actions>
            <span @click="reset" class="flex flex-row items-center justify-center"
              ><IconLogout2 class="h-6 m-2" />Volver</span
            >
            <span @click="reload" class="flex flex-row items-center justify-center"
              ><IconReload class="h-6 m-2" />Recargar</span
            >
          </template>
        </a-card>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { vMaska } from 'maska/vue'
import { tryit } from 'radash'
import { message } from 'ant-design-vue'
import { useEditionsStore } from '@/stores/editions'
import { useUserStore } from '@/stores/user'
import { IconLogout2, IconReload, IconDownload, IconCalendarCheck } from '@tabler/icons-vue'
import { isAfter } from 'date-fns'

interface FormState {
  nif: string
  email: string
  remember: boolean
}

type Attendance = {
  sessions: {
    time: string
    events: string[]
    eventHours: number[]
    hours: number
  }[]
  percent: number
}

type SearchResult = {
  id: string | null
  asistencia: Attendance
  microcursos: {
    doble: boolean
    micro1: string
    micro2: string
  }
  poster: boolean
}

const results = ref<SearchResult>({
  id: null,
  asistencia: {
    sessions: [],
    percent: 0
  },
  microcursos: {
    doble: false,
    micro1: '',
    micro2: ''
  },
  poster: false
})

const hoursDone = computed(
  () =>
    (results.value.asistencia.sessions
      .map((item) => item.hours)
      .reduce((prev, curr) => (prev ?? 0) + (curr ?? 0), 0) as number) +
    (editionsStore.selected === 'ceebi-iii' && results.value.asistencia.percent > 0 ? 0.5 : 0)
)

const available = ref(isAfter(new Date(), new Date(2025, 6, 18, 19, 35)))
const downloadable = computed<
  boolean | { asistencia: boolean; microcursos: boolean; poster: boolean }
>(() => true)
const notAvailableTxt = ref('Certificados aún no disponibles')
const editionsStore = useEditionsStore()
const usersStore = useUserStore()
const loading = ref(false)
const notFound = ref(false)
const activeTab = ref('asistencia')
const error = ref('')
const attendPercent = ref(0)
const microPercent = ref(0)
const modalVisible = ref(false)

const formState = reactive<FormState>({
  nif: '',
  email: '',
  remember: false
})

const tabList = [
  {
    key: 'asistencia',
    tab: 'Asistencia'
  },
  {
    key: 'microcurso',
    tab: 'Microcursos'
  },
  {
    key: 'poster',
    tab: 'Póster'
  }
]

async function onSubmit(doReset = true) {
  loading.value = true
  if (doReset) reset()
  const [err, res] = await tryit(fetch)(
    `${import.meta.env.VITE_API_URL}/${editionsStore.selected}/consulta/certificado?nif=${formState.nif.trim()}&email=${formState.email.trim()}`
  )
  if (err) {
    error.value =
      'No se ha podido conectar con el servidor. Conctacta con nosotros por correo info@biociencias.es'
  } else {
    if (res.status === 200) {
      results.value = await res.json()
      upPercent()
      if (formState.remember) {
        usersStore.email = formState.email
      } else {
        usersStore.email = null
      }
      if (doReset) message.success('Usuario encontrado.')
    } else if (res.status === 404) {
      notFound.value = true
      error.value =
        'No se ha encontrado ningún usuario para el NIF y correo electrónico proporcionados. Si crees que es un error, conctacta con nosotros por correo info@biociencias.es'
    } else {
      error.value =
        'Respuesta inesperada del servidor. Conctacta con nosotros por correo info@biociencias.es'
    }
  }
  loading.value = false
}

async function upPercent() {
  if (activeTab.value === 'asistencia') {
    attendPercent.value = 0
    while (attendPercent.value < Math.trunc(results.value.asistencia.percent * 100) / 100) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attendPercent.value += 1
    }
  } else if (activeTab.value === 'microcurso') {
    microPercent.value = 0
    if (!results.value.microcursos.doble) {
      if (results.value.microcursos.micro1) {
        while (microPercent.value < 100) {
          await new Promise((resolve) => setTimeout(resolve, 5))
          microPercent.value += 1
        }
      }
    } else {
      const maxPercent =
        (results.value.microcursos.micro1 ? 50 : 0) + (results.value.microcursos.micro2 ? 50 : 0)
      while (microPercent.value < maxPercent) {
        await new Promise((resolve) => setTimeout(resolve, 5))
        microPercent.value += 1
      }
    }
  } else {
    // Póster
    return
  }
}

function reset() {
  notFound.value = false
  results.value = {
    id: null,
    asistencia: {
      sessions: [],
      percent: 0
    },
    microcursos: {
      doble: false,
      micro1: '',
      micro2: ''
    },
    poster: false
  }
  error.value = ''
}

const onTabChange = (value: string) => {
  error.value = ''
  activeTab.value = value
  upPercent()
}

const reload = async () => {
  loading.value = true
  await onSubmit(false)
  loading.value = false
}

editionsStore.$subscribe(() => reset())

async function download(micro?: string) {
  error.value = ''
  let url = `${import.meta.env.VITE_API_URL}/${editionsStore.selected}/certificado/${activeTab.value}`
  if (activeTab.value === 'microcurso' && micro) {
    const microId = micro.replace(/[áóéíú:(),¿?.ñ¡!\-\/“”– ]/g, '_')
    url += '/' + microId
  }

  url += '/' + results.value.id

  if (activeTab.value === 'asistencia' || activeTab.value === 'microcurso') {
    url += '.pdf'
  } else {
    url += '.zip'
  }

  const [err, res] = await tryit(fetch)(url)

  if (err) {
    error.value =
      'No se ha podido conectar con el servidor. Conctacta con nosotros por correo info@biociencias.es'
  } else {
    if (res.status === 200) {
      window.open(url, '_blank')
      message.success('Certificado descargado.')
    } else if (res.status === 403) {
      error.value =
        'No cumples los requisitos para obtener este certificado. Si crees que se trata de un error, conctacta con nosotros por correo info@biociencias.es'
    } else {
      error.value =
        'Respuesta inesperada del servidor. Conctacta con nosotros por correo info@biociencias.es'
    }
  }
}

onBeforeMount(() => {
  if (usersStore.email) {
    formState.remember = true
    formState.email = usersStore.email
  }
})
</script>

<style>
.ant-tabs-nav-list {
  margin-left: auto;
  margin-right: auto;
}
.ant-progress-text {
  color: inherit !important;
}
.micro-btn .ant-btn {
  white-space: inherit;
  height: fit-content;
}
</style>
