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
import { useMECStore } from '@/stores/mec'
import { useRouter } from 'vue-router'
import { createClient } from '@supabase/supabase-js'
import { useAsyncState } from '@vueuse/core'

const supabase = createClient(
  import.meta.env.SUPABASE_URL_2024,
  import.meta.env.SUPABASE_KEY_2024,
  { auth: { persistSession: false } }
)
const router = useRouter()
const userStore = useUserStore()
const error = ref(false)
const loading = ref(true)
const question = ref('')
const mec = useMECStore()

const __fn = () =>
  supabase.from('question_sessions').select('*').eq('is_open', true).limit(1).maybeSingle()
type Session = Awaited<ReturnType<typeof __fn>>

mec.load()
const { state: currentSession, execute: reloadSession } = useAsyncState(
  async () =>
    await supabase.from('question_sessions').select('*').eq('is_open', true).limit(1).maybeSingle(),
  null as Session | null,
  {
    resetOnExecute: false
  }
)
// onMounted hook is needed to ensure that setTimeout is defined
onMounted(() => setInterval(reloadSession, 10000))
const eventTitle = computed(
  () => mec.mec?.findId(currentSession.value?.data?.event_id ?? -1)?.title
)

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

const fn = async () =>
  ((await supabase.from('questions').select('*, question_likes(count)')).data ?? [])
    .sort((a, b) => b.question_likes[0].count - a.question_likes[0].count)
    .filter((q) => q.user_id === userStore.user?.id || !q.hidden)
type QS = Awaited<ReturnType<typeof fn>>

const questions: Ref<QS> = ref([])
;(async () => {
  questions.value = (
    (await supabase.from('questions').select('*, question_likes(count)')).data ?? []
  )
    .sort(
      (a, b) =>
        (b.question_likes ?? [{ count: 0 }])[0].count -
        (a.question_likes ?? [{ count: 0 }])[0].count
    )
    .filter((q) => q.user_id === userStore.user?.id || !q.hidden)
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
        if (payload.eventType === 'DELETE')
          questions.value.splice(
            questions.value.findIndex((q) => q.id === payload.old.id),
            1
          )
        else if (payload.eventType === 'INSERT') questions.value.push(payload.new as QS[number])
        else {
          logger.info('updating question', payload)
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
          (await supabase.from('questions').select('*, question_likes(count)')).data ?? []
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
})()

const liked = ref([] as number[])
;(async () => {
  const my_likes = await supabase
    .from('question_likes')
    .select('*')
    .eq('user_id', userStore.user?.acf.id_base_de_datos_app ?? -1)
  liked.value = my_likes.data?.map((q) => q.question_id) ?? []
})()

const likesGiven: Record<number, number> = {}
const areLikesGivenLoaded = ref(false)
const computeLikesGiven = async () => {
  if (userStore.user === null) {
    useToast({
      color: 'danger',
      message: t('question.modal.toasts.nullUserError')
    })
    dismissModal()
  } else if (likesGiven[props.session.id] === undefined) {
    const { data, error } = await supabase
      .from('user_likes_given')
      .select('*', { count: 'exact' })
      .eq('session_id', props.session.id)
      .eq('user_id', userStore.user.id)
    if (error) {
      useToast({
        color: 'danger',
        message: t('question.modal.toasts.errorRetrievingUserLikes')
      })
      dismissModal()
    } else {
      if (data === null || data.length === 0 || data[0].count === 0) {
        const { error } = await supabase.from('user_likes_given').insert({
          session_id: props.session.id,
          user_id: userStore.user.id,
          like_count: 0
        })
        logger.info('likes inserted', error)
      } else {
        likesGiven[props.session.id] = data[0].like_count
      }
    }
    areLikesGivenLoaded.value = true
  }
}
onMounted(computeLikesGiven)
watch(props.session, computeLikesGiven)

// const dbg = <T,>(x: T) => {
//   console.info('dbg', x);
//   return x;
// };

const toggleLike = async (id: number, isInitial: boolean = false) => {
  if (liked.value.includes(id)) {
    const { error } = await supabase
      .from('question_likes')
      .delete()
      .eq('user_id', userStore.user?.acf.id_base_de_datos_app ?? -1)
      .eq('question_id', id)
    if (error)
      useToast({
        color: 'danger',
        icon: warningOutline,
        message: 'Error al registrar reacción a la pregunta',
        cssClass: ''
      })
    else liked.value.splice(liked.value.indexOf(id), 1)
  } else if (likesGiven[props.session.id] > 15 && !isInitial) {
    useToast({
      color: 'danger',
      icon: closeCircleOutline,
      message: t('question.modal.toasts.likeLimitReached'),
      cssClass: ''
    })
  } else {
    if (userStore.user?.acf.id_base_de_datos_app === undefined) {
      useToast({
        color: 'danger',
        icon: warningOutline,
        message: t('question.modal.toasts.nullUserError'),
        cssClass: ''
      })
      return
    }
    const { error } = await supabase.from('question_likes').insert({
      user_id: userStore.user?.acf.id_base_de_datos_app,
      question_id: id
    })
    if (error) {
      useToast({
        color: 'danger',
        icon: warningOutline,
        message: t('question.modal.toasts.saveLikeError'),
        cssClass: ''
      })
    } else {
      liked.value.push(id)
      if (!isInitial) {
        const { error } = await supabase.rpc('increment_user_likes', {
          req_user_id: userStore.user.id,
          req_session_id: props.session.id
        })
        if (error) {
          useToast({
            color: 'warning',
            cssClass: '',
            icon: warningOutline,
            message: t('question.modal.toasts.registerLikeError')
          })
          logPostgrestError(
            'questionsModal:toggleLike',
            'rpc(increment_user_likes) for ' + id.toString(),
            null,
            error
          )
        }
        likesGiven[props.session.id] += 1
      }
    }
  }
}

const questionToAsk = ref('')
const publishingQuestion = ref(false)
const sendQuestion = async () => {
  if (publishingQuestion.value) return

  const questionParagraphs = questionToAsk.value.split('\n').length
  if (questionParagraphs > 3) {
    useToast({
      color: 'warning',
      icon: warningOutline,
      message: t('question.modal.toasts.maxLinesReached'),
      cssClass: ''
    })
    logger.info(
      'questionsModal:sendQuestion',
      'user tried to ask more than 3 lines: ' + questionParagraphs
    )
    return
  }

  publishingQuestion.value = true
  const { data, error } = await supabase.functions.invoke('publish-question', {
    body: {
      question: questionToAsk.value,
      user: userStore.user?.id ?? -1
      // TODO apikey as header
    },
    headers: {
      apikey: import.meta.env.VITE_BUILD_KEY
    }
  })
  console.info('data', data, error)
  publishingQuestion.value = false

  if (error) {
    if (error['custom_error_message'])
      useToast({
        color: 'danger',
        icon: warningOutline,
        message: error.custom_error_message,
        cssClass: ''
      })
    else
      useToast({
        color: 'danger',
        icon: warningOutline,
        message: t('question.modal.toasts.genericSendError'),
        cssClass: ''
      })
    return
  }

  questionToAsk.value = ''
  toggleLike(data, true)
}

const deleteQuestion = async (id: number, question_user_id: number) => {
  if (userStore.user?.id != question_user_id) return

  const progressToast = await useToast({
    message: t('question.modal.toasts.deletingQuestionInProgress'),
    cssClass: ''
  })

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)
    .eq('user_id', userStore.user.id)

  progressToast.dismiss()
  if (error) {
    useToast({
      color: 'danger',
      message: t('question.modal.toasts.deletingQuestionError'),
      icon: closeCircleOutline,
      cssClass: ''
    })
    logPostgrestError(
      'questionsModal:deleteQuestion',
      'error from supabase when deleting question' + error.message,
      null,
      error
    )
  } else {
    useToast({
      color: 'success',
      message: t('question.modal.toasts.deletingQuestionSucceded'),
      icon: checkmarkCircleOutline,
      cssClass: ''
    })
  }
}

onMounted(() => {
  logger.trace('questionsModal:onMounted', 'current session', props.session)
})
</script>
