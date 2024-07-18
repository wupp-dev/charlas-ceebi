<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <header>
      <TopNav :title="'Ver y hacer preguntas'" />
    </header>
    <main class="flex flex-col flex-grow items-center md:justify-center">
      <div>
        <a-spin v-auto-animate :spinning="loading" tip="Conectando con el servidor...">
          <a-card
            v-auto-animate
            class="m-8 max-w-[30rem]"
            title="Inicia sesión"
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
              @finishFailed="onFinishFailed"
            >
              <a-form-item
                label="Correo electrónico"
                name="email"
                :rules="[{ required: true, message: 'Introduce tu correo electrónico.' }]"
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
                label="Contraseña"
                name="password"
                :rules="[{ required: true, message: 'Introduce tu contraseña.' }]"
              >
                <a-input-password v-model:value="formState.password" placeholder="************" />
              </a-form-item>
              <a-form-item name="remember" :wrapper-col="{ span: 32 }">
                <a-checkbox v-model:checked="formState.remember"
                  >Recordar correo electrónico</a-checkbox
                >
              </a-form-item>
              <div class="w-fit mx-auto">
                <a-form-item :wrapper-col="{ span: 32 }">
                  <a-button type="primary" html-type="submit">Iniciar sesión</a-button>
                </a-form-item>
              </div>
            </a-form>
          </a-card></a-spin
        >
      </div>
    </main>
    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { vMaska } from 'maska/vue'
import { useEditionsStore } from '@/stores/editions'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

interface FormState {
  email: string
  password: string
  remember: boolean
}

const editionsStore = useEditionsStore()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const formState = reactive<FormState>({
  email: '',
  password: '',
  remember: false
})
const error = ref('')
const supported = computed(() => editionsStore.selected === editionsStore.latest)

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await userStore.login(formState.email, formState.password)
  } catch (e) {
    if (e instanceof Error && typeof e.message === 'string') {
      if (e.message === '[jwt_auth] invalid_username') {
        message.error('El correo electrónico introducido no es válido.')
        error.value = 'El correo electrónico introducido no es válido.'
      } else if (e.message === '[jwt_auth] incorrect_password') {
        message.error('La contraseña introducida no es válida.')
        error.value = 'La contraseña introducida no es válida.'
      } else {
        message.error('Ha ocurrido un error al iniciar sesión.')
        error.value = 'Ha ocurrido un error al iniciar sesión.'
      }
    } else {
      message.error('Ha ocurrido un error al iniciar sesión.')
      error.value = 'Ha ocurrido un error al iniciar sesión.'
    }
  }
  loading.value = false
  if (userStore.user) {
    if (formState.remember) {
      userStore.email = formState.email
    } else {
      userStore.email = null
    }
    message.success('Sesión iniciada correctamente.')
    router.push('/pregunta')
  }
}

function onFinishFailed() {
  error.value = ''
}

watch(supported, () => {
  if (!supported.value) {
    router.push('/pregunta')
  }
})

onBeforeMount(async () => {
  loading.value = true
  if (!supported.value) {
    router.push('/pregunta')
  }
  if (userStore.email) {
    formState.email = userStore.email
    formState.remember = true
  }
  await userStore.refreshUser()
  if (userStore.user) {
    message.success('Sesión ya iniciada.')
    router.push('/pregunta')
  }
  loading.value = false
})
</script>
