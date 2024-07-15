<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <header>
      <TopNav :title="'Ver y hacer preguntas'" />
    </header>
    <main class="flex flex-col flex-grow items-center md:justify-center">
      <div>
        <a-spin v-auto-animate :spinning="loading">
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
              autocomplete="off"
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
              <a-form-item :wrapper-col="{ span: 32 }">
                <a-button type="primary" html-type="submit">Iniciar sesión</a-button>
              </a-form-item>
            </a-form>
            <a-alert v-if="error" :message="error" :type="'error'" show-icon /> </a-card
        ></a-spin>
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
import { useRouter } from 'vue-router'

interface FormState {
  email: string
  password: string
}

const editionsStore = useEditionsStore()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const formState = reactive<FormState>({
  email: '',
  password: ''
})
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await userStore.login(formState.email, formState.password)
  } catch (e) {
    error.value = 'Ha ocurrido un error al iniciar sesión.'
  }
  loading.value = false
  if (userStore.user) {
    router.push('/pregunta')
  }
}

function onFinishFailed() {
  error.value = ''
}

onMounted(() => {
  if (userStore.user) {
    router.push('/pregunta')
  }
})
</script>
