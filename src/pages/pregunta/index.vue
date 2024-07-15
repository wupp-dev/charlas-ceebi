<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <header>
      <TopNav :title="'Ver y hacer preguntas'" />
    </header>
    <div class="mx-auto w-fit m-4">
      <a-spin v-if="loading" tip="Conectando con el servidor..." />
      <a-alert
        v-else-if="currentSession"
        message="Sesión en curso"
        :description="currentSession"
        type="info"
        style="font-size: 1rem"
        show-icon
      />
      <a-alert
        v-else-if="error"
        message="Ha ocurrido un problema al intentar conectarse al servidor."
        type="error"
        style="font-size: 1rem"
        show-icon
      />
      <a-alert
        v-else="error"
        message="Actualmente no hay ninguna sesión en curso."
        type="warning"
        style="font-size: 1rem"
        show-icon
      />
    </div>
    <main v-auto-animate class="flex flex-col flex-grow items-center md:justify-center">
      <div v-if="currentSession" class="max-md:mt-10 w-6/12 max-w-[35rem] min-w-[20rem]">
        <a-input-search
          v-model:value="question"
          placeholder="¿Conoces el chiste del pingüino?"
          size="large"
          class="w-full"
          :status="error ? 'error' : ''"
          :disabled="loading"
          @search="onSubmit"
        >
          <template #enterButton>
            <a-button type="primary">Preguntar</a-button>
          </template>
        </a-input-search>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const currentSession = ref(null)
const error = ref(false)
const loading = ref(true)
const question = ref('')

const onSubmit = () => {
  console.log(question.value)
}

watch(
  () => userStore.user,
  async (user) => {
    if (!user) {
      router.push('/pregunta/login')
    }
  }
)

onMounted(() => {
  if (!userStore.user) {
    router.push('/pregunta/login')
  }
})
</script>
