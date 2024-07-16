<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <header>
      <TopNav :title="'Ver y hacer preguntas'" />
    </header>
    <div v-if="supported">
      <div class="m-4">
        <div v-if="loading" class="w-fit mx-auto">
          <a-spin tip="Conectando con el servidor..." />
        </div>
        <a-alert
          v-else-if="currentSession"
          message="Sesión en curso"
          :description="eventTitle"
          type="info"
          style="font-size: 1rem"
          show-icon
          class="max-w-[80%] mx-auto"
        />
        <a-alert
          v-else-if="error"
          message="Ha ocurrido un problema al intentar conectarse al servidor."
          type="error"
          style="font-size: 1rem"
          show-icon
        />
        <a-alert
          v-else
          message="Actualmente no hay ninguna sesión en curso."
          type="warning"
          style="font-size: 1rem"
          show-icon
        />
      </div>

      <form
        v-if="currentSession"
        @submit.prevent="sendQuestion"
        class="max-md:mt-10 w-6/12 max-w-[35rem] min-w-[20rem] mb-6 mx-auto flex flex-col items-stretch justify-center"
      >
        <a-textarea
          v-model:value="questionToAsk"
          placeholder="Escribe tu pregunta"
          size="large"
          class="w-full"
          :status="error ? 'error' : ''"
          :disabled="loading"
          required
          :minlength="20"
          :maxlength="500"
          showCount
        >
          <template #enterButton>
            <a-button type="primary">Preguntar</a-button>
          </template>
        </a-textarea>
        <a-button html-type="submit" type="primary" class="mt-5"> Enviar </a-button>
      </form>

      <main v-auto-animate class="">
        <a-card
          v-for="question in questions"
          :key="question.id"
          class="w-80 mb-4 mx-auto border-0"
          :class="{
            'border-l-8 border-primary':
              question.user_id === userStore.user?.id && !question.hidden,
            'border-l-8 border-amber-500': question.hidden
          }"
          :body-style="{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
            justifyContent: 'space-evenly',
            padding: 0
          }"
          @contextmenu.prevent="() => promptDeleteQuestion(question.id, question.user_id ?? -1)"
        >
          <p class="whitespace-pre-wrap flex-grow max-w-[85%] break-words p-5">
            {{ question.question }}
          </p>
          <div class="flex flex-col justify-end" @click="toggleLike(question.id)">
            <a-badge
              v-if="question.question_likes[0].count > 0"
              :count="question.question_likes[0].count ?? 0"
              color="cyan"
            ></a-badge>
            <IconThumbUpFilled v-if="isQuestionLiked(question.id)" class="size-5 mb-2" />
            <IconThumbUp class="size-5 mb-2" v-else />
          </div>

          <p class="absolute left-2 top-1 text-sm text-gray-500" v-if="question.hidden">
            <IconEyeOff class="inline-block size-4 -mt-1.5" /> Oculta
          </p>
        </a-card>
      </main>
    </div>
    <div v-else class="flex flex-col flex-grow items-center md:justify-center">
      <a-alert
        message="Edición no soportada, cambia a la edición actual para poder ver y hacer preguntas."
        type="warning"
        style="font-size: 1.125rem"
        class="m-8"
        show-icon
      />
    </div>

    <Footer />
  </div>

  <contextHolder />
</template>

<script setup lang="ts">
import { message, Modal } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import { useMECStore } from '@/stores/mec'
import { useEditionsStore } from '@/stores/editions'
import { useEditionStore } from '@/stores/edition'
import { useRouter } from 'vue-router'
import { createClient } from '@supabase/supabase-js'
import { useAsyncState } from '@vueuse/core'
import type { Database } from '@/supabase-types'
import { IconThumbUpFilled, IconThumbUp, IconAlertCircle, IconEyeOff } from '@tabler/icons-vue'

const supabase = createClient<Database>(
  import.meta.env.SUPABASE_URL_2024,
  import.meta.env.SUPABASE_KEY_2024,
  { auth: { persistSession: false } }
)
const router = useRouter()
const userStore = useUserStore()
const editionsStore = useEditionsStore()
const editionStore = useEditionStore()
const error = ref(false)
const supported = computed(() => editionStore.selected === editionsStore.latest)
const loading = ref(true)
const mec = useMECStore()

const [modal, contextHolder] = Modal.useModal()

const __fn = () =>
  supabase.from('question_sessions').select('*').eq('is_open', true).limit(1).maybeSingle()
type Session = Awaited<ReturnType<typeof __fn>>['data']

mec.load()
const { state: currentSession, execute: reloadSession } = useAsyncState(
  async () =>
    await supabase
      .from('question_sessions')
      .select('*')
      .eq('is_open', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data),
  null as Session | null,
  {
    resetOnExecute: false,
    immediate: false,
    onError(e) {
      message.error('Error al cargar la sesión actual: ' + e)
    }
  }
)
const eventTitle = computed(() => mec.mec?.findId(currentSession.value?.event_id ?? -1)?.title)

watch(
  () => userStore.user,
  async (user) => {
    if (!user) {
      router.push('/pregunta/login')
    }
  }
)

const fetchQuestions = async () =>
  (
    (
      await supabase
        .from('questions')
        .select('*, question_likes(count)')
        .eq('session_id', currentSession.value?.id ?? -1)
    ).data ?? []
  )
    .sort(
      (a, b) =>
        (b.question_likes ?? [{ count: 0 }])[0].count -
        (a.question_likes ?? [{ count: 0 }])[0].count
    )
    .filter((q) => q.user_id === userStore.user?.id || !q.hidden)
type QS = Awaited<ReturnType<typeof fetchQuestions>>

const questions: Ref<QS> = ref([])
const setupQuestions = async () => {
  questions.value = await fetchQuestions()
  supabase
    .channel('supabase_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'questions'
      },
      (payload) => {
        // Not working but shouldn't need this
        // if (
        //   payload.new &&
        //   payload.new.session_id !== currentSession.value?.id &&
        //   payload.old &&
        //   payload.old.session_id !== currentSession.value?.id
        // ) {
        //   console.warn('Not for this session', payload)
        //   return
        // }

        if (payload.eventType === 'DELETE')
          questions.value.splice(
            questions.value.findIndex((q) => q.id === payload.old.id),
            1
          )
        else if (payload.eventType === 'INSERT') questions.value.push(payload.new as QS[number])
        else {
          console.info('updating question', payload)
          const idx = questions.value.findIndex((q) => q.id === payload.old.id)

          if (idx == -1) questions.value.push(payload.new as QS[number])
          else questions.value[idx] = payload.new as QS[number]
        }
        questions.value = questions.value
          .sort(
            (a, b) =>
              (b.question_likes ?? [{ count: 0 }])[0].count -
              (a.question_likes ?? [{ count: 0 }])[0].count
          )
          .filter((q) => q.user_id === userStore.user?.id || !q.hidden)
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'question_likes'
      },
      async () => {
        questions.value = (
          (
            await supabase
              .from('questions')
              .select('*, question_likes(count)')
              .eq('session_id', currentSession.value?.id ?? -1)
          ).data ?? []
        )
          .sort(
            (a, b) =>
              (b.question_likes ?? [{ count: 0 }])[0].count -
              (a.question_likes ?? [{ count: 0 }])[0].count
          )
          .filter((q) => q.user_id === userStore.user?.id || !q.hidden)
      }
    )
    .subscribe()
}

const liked = ref([] as number[])
const setupLiked = async () => {
  const my_likes = await supabase
    .from('question_likes')
    .select('*')
    .eq('user_id', userStore.user?.acf.id_base_de_datos_app ?? -1)
  liked.value = my_likes.data?.map((q) => q.question_id) ?? []
}
const isQuestionLiked = computed(() => (id: number) => liked.value.includes(id))

const likesGiven: Record<number, number> = {}
const areLikesGivenLoaded = ref(false)
const computeLikesGiven = async () => {
  if (userStore.user === null) {
    message.error('No se ha encontrado el usuario')
  } else if (currentSession.value === null) {
    message.error('No se ha encontrado la sesión actual')
  } else if (likesGiven[currentSession.value.id ?? -1] === undefined) {
    const { data, error } = await supabase
      .from('user_likes_given')
      .select('*', { count: 'exact' })
      .eq('session_id', currentSession.value.id)
      .eq('user_id', userStore.user.id)
    if (error) {
      message.error('Error al obtener los likes: ' + error.message)
    } else {
      // @ts-ignore data[0].count does exist
      if (data === null || data.length === 0 || data[0].count === 0) {
        const { error } = await supabase.from('user_likes_given').insert({
          session_id: currentSession.value.id,
          user_id: userStore.user.id,
          like_count: 0
        })
        console.info('likes inserted', error)
      } else {
        likesGiven[currentSession.value.id] = data[0].like_count
      }
    }
    areLikesGivenLoaded.value = true
  }
}

const toggleLike = async (id: number, isInitial: boolean = false) => {
  if (currentSession.value === null) {
    message.error('No se ha encontrado la sesión actual')
    return
  }

  if (liked.value.includes(id)) {
    const { error } = await supabase
      .from('question_likes')
      .delete()
      .eq('user_id', userStore.user?.acf.id_base_de_datos_app ?? -1)
      .eq('question_id', id)
    if (error) message.error('Error al registrar reacción a la pregunta')
    else liked.value.splice(liked.value.indexOf(id), 1)
  } else if (likesGiven[currentSession.value.id] > 15 && !isInitial) {
    message.error('No puedes dar más a like en esta sesión')
  } else {
    if (userStore.user?.acf.id_base_de_datos_app === undefined) {
      message.error('No se ha encontrado el usuario')
      return
    }
    const { error } = await supabase.from('question_likes').insert({
      user_id: userStore.user?.acf.id_base_de_datos_app,
      question_id: id
    })
    if (error) {
      message.error('Error al registrar la reacción')
    } else {
      liked.value.push(id)
      if (!isInitial) {
        const { error } = await supabase.rpc('increment_user_likes', {
          req_user_id: userStore.user.id,
          req_session_id: currentSession.value.id
        })
        if (error) {
          message.warn('Error al registrar la reacción')
        }
        likesGiven[currentSession.value.id] += 1
      }
    }
  }
}

const questionToAsk = ref('')
const publishingQuestion = ref(false)
const sendQuestion = async () => {
  if (publishingQuestion.value) return

  if (questionToAsk.value.length < 20) {
    message.error('Mínimo 20 caracteres')
    return
  } else if (questionToAsk.value.length > 500) {
    message.error('Máximo 500 caracteres')
    return
  }

  const questionParagraphs = questionToAsk.value.split('\n').length
  if (questionParagraphs > 3) {
    message.error('Máximo 3 párrafos por pregunta')
    return
  }

  publishingQuestion.value = true
  const { data, error } = await supabase.functions.invoke('publish-question', {
    body: {
      question: questionToAsk.value,
      user: userStore.user?.id ?? -1
    },
    headers: {
      apikey: import.meta.env.VITE_BUILD_KEY
    }
  })
  console.info('data', data, error)
  publishingQuestion.value = false

  if (error) {
    if (error['custom_error_message']) message.error(error.custom_error_message)
    else message.error('Error al enviar la pregunta')
    return
  }

  questionToAsk.value = ''
  toggleLike(data, true)
}

const promptDeleteQuestion = (id: number, question_user_id: number) => {
  if (userStore.user?.id != question_user_id) return

  modal.confirm({
    title: '¿Seguro que quieres borrar esta pregunta?',
    icon: h(IconAlertCircle, { class: 'size-10 inline-block text-amber-500' }),
    content: 'Esta acción no puede ser revertida. Los likes de la pregunta se perderán.',
    okText: 'Eliminar',
    okType: 'danger',
    cancelText: 'Cancelar',
    onOk() {
      deleteQuestion(id, question_user_id)
    },
    onCancel() {
      console.log('Cancel')
    }
  })
}
const deleteQuestion = async (id: number, question_user_id: number) => {
  if (userStore.user?.id != question_user_id) return

  const hideLoading = message.loading('Borrando pregunta...', 0)

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)
    .eq('user_id', userStore.user.id)

  hideLoading()
  if (error) {
    message.error('Error al eliminar la pregunta')
  } else {
    message.success('Pregunta eliminada correctamente')
  }
}

const load = async (loadSession = true) => {
  loading.value = true

  if (loadSession) await reloadSession()
  if (currentSession.value !== null) {
    await setupQuestions()
    await setupLiked()
    await computeLikesGiven()
  }

  loading.value = false
}

watch(currentSession, (newSession, oldSession) => {
  if (!newSession && oldSession) {
    questions.value = []
  } else if (newSession && newSession.id !== oldSession?.id) {
    questions.value = []
    load(false)
  }
})

watch(supported, () => {
  if (supported.value && !userStore.user) {
    router.push('/pregunta/login')
  }
})

onMounted(() => {
  load()
  setInterval(reloadSession, 10000)
})

onBeforeMount(() => {
  if (!supported.value) {
    return
  }
  if (!userStore.user) {
    router.push('/pregunta/login')
    return
  }
})
</script>
