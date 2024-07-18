<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useEditionsStore } from '@/stores/editions'

const showNewEditionModal = ref(false)
const editionsStore = useEditionsStore()

const newEditionHandleOk = () => {
  editionsStore.selected = editionsStore.latest
  showNewEditionModal.value = false
}

onMounted(() => {
  if (editionsStore.selected !== editionsStore.latest) {
    showNewEditionModal.value = true
  }
})
</script>

<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#34B6ED'
      }
    }"
  >
  </a-config-provider>
  <a-modal
    v-model:open="showNewEditionModal"
    title="Aviso"
    cancelText="No"
    okText="Sí"
    @ok="newEditionHandleOk"
  >
    <p class="mb-2">
      Tienes seleccionada una edición del CEEBI que no es la más reciente, ¿quieres cambiar a la
      actual?
    </p>
  </a-modal>
  <RouterView />
</template>
